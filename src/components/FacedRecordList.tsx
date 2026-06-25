"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteFacedRecord, getFacedRecords } from "@/lib/db";
import { exportFacedToExcel } from "@/lib/export-excel";
import { syncPendingRecords } from "@/lib/sync-client";
import type { FacedRecord, SyncStatus } from "@/lib/faced-types";
import {
  CloudUpload,
  Download,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";
import { SkeletonRecordList, SkeletonScreen } from "@/components/ui/Skeleton";

type FacedRecordListProps = {
  refreshKey: number;
  onEdit: (id: number) => void;
  onSynced?: () => void;
  onRecordsChanged?: () => void;
};

function headName(record: FacedRecord): string {
  const h = record.head_of_family;
  return [h.first_name, h.middle_name, h.last_name].filter(Boolean).join(" ");
}

function syncBadge(status: SyncStatus) {
  const styles: Record<SyncStatus, string> = {
    pending: ui.badgePending,
    synced: ui.badgeSynced,
    failed: ui.badgeFailed,
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function FacedRecordList({ refreshKey, onEdit, onSynced, onRecordsChanged }: FacedRecordListProps) {
  const [records, setRecords] = useState<FacedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | SyncStatus>("all");

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFacedRecords();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords, refreshKey]);

  const filtered =
    filter === "all" ? records : records.filter((r) => r.sync_status === filter);

  async function handleDelete(id: number) {
    if (!confirm("Delete this FACED record?")) return;
    await deleteFacedRecord(id);
    await loadRecords();
    onRecordsChanged?.();
  }

  function handleExport(scope: "all" | "filtered" | "pending") {
    let toExport = records;
    if (scope === "filtered") toExport = filtered;
    if (scope === "pending")
      toExport = records.filter((r) => r.sync_status === "pending");
    if (toExport.length === 0) {
      alert("No records to export.");
      return;
    }
    const date = new Date().toISOString().slice(0, 10);
    exportFacedToExcel(toExport, `FACED_${date}.xlsx`);
  }

  async function handleSync() {
    if (!navigator.onLine) {
      setSyncMessage("You are offline. Connect to the internet to sync.");
      return;
    }

    const pendingCount = records.filter(
      (r) => r.sync_status === "pending" || r.sync_status === "failed",
    ).length;

    if (pendingCount === 0) {
      setSyncMessage("All records are already synced.");
      return;
    }

    setSyncing(true);
    setSyncMessage(null);

    try {
      const result = await syncPendingRecords();
      await loadRecords();
      onSynced?.();
      if (result.failed > 0) {
        const detail = result.errors?.[0];
        setSyncMessage(
          `Synced ${result.synced}, failed ${result.failed}.${detail ? ` ${detail}` : ""}`,
        );
      } else {
        setSyncMessage(`Successfully synced ${result.synced} record(s) online.`);
      }
    } catch (err) {
      setSyncMessage(
        err instanceof Error ? err.message : "Sync failed. Check your connection and .env.",
      );
    } finally {
      setSyncing(false);
    }
  }

  const pendingCount = records.filter(
    (r) => r.sync_status === "pending" || r.sync_status === "failed",
  ).length;

  if (loading) {
    return (
      <SkeletonScreen label="Loading saved records">
        <SkeletonRecordList rows={4} />
      </SkeletonScreen>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | SyncStatus)}
          className={cn(ui.input, "w-auto text-sm")}
        >
          <option value="all">All records ({records.length})</option>
          <option value="pending">
            Unsynced ({records.filter((r) => r.sync_status === "pending").length})
          </option>
          <option value="synced">
            Synced ({records.filter((r) => r.sync_status === "synced").length})
          </option>
          <option value="failed">
            Failed ({records.filter((r) => r.sync_status === "failed").length})
          </option>
        </select>
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={syncing || pendingCount === 0}
          className={cn(ui.btnPrimary, ui.withIcon, "text-sm disabled:cursor-not-allowed disabled:opacity-60")}
        >
          {syncing ? (
            <>
              <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
              Syncing online...
            </>
          ) : (
            <>
              <CloudUpload className={ui.iconSm} aria-hidden />
              Sync online ({pendingCount})
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => handleExport("all")}
          className={cn(ui.btnSecondary, ui.withIcon, "text-sm")}
        >
          <Download className={ui.iconSm} aria-hidden />
          Export all to Excel
        </button>
        <button
          type="button"
          onClick={() => handleExport("pending")}
          className={cn(ui.btnSecondary, ui.withIcon, "text-sm")}
        >
          <Download className={ui.iconSm} aria-hidden />
          Export unsynced
        </button>
      </div>

      {syncMessage && (
        <p
          className={
            syncMessage.includes("Successfully") ? ui.alertSuccess : ui.alertWarning
          }
          role="status"
        >
          {syncMessage}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-faced-blue-border bg-white px-4 py-10 text-center text-sm text-zinc-500 shadow-sm">
          No FACED records yet. Fill out the form above to add the first record.
        </p>
      ) : (
        <ul className={cn(ui.card, "divide-y divide-faced-blue-border")}>
          {filtered.map((record) => (
            <li
              key={record.id}
              className="flex items-start justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-ph-blue-light/40"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-zinc-900">{headName(record)}</p>
                  {syncBadge(record.sync_status)}
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  Brgy. {record.barangay}
                  {record.city_municipality && `, ${record.city_municipality}`}
                </p>
                <p className="mt-1 text-xs text-zinc-400">
                  {record.family_members.length} family member
                  {record.family_members.length !== 1 ? "s" : ""} ·{" "}
                  {record.createdAt.toLocaleString()}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
                <button
                  type="button"
                  onClick={() => record.id && onEdit(record.id)}
                  className={cn(ui.link, ui.withIcon, "text-sm")}
                >
                  <Pencil className={ui.iconSm} aria-hidden />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => record.id && void handleDelete(record.id)}
                  className={cn(ui.withIcon, "text-sm font-semibold text-ph-red hover:underline")}
                >
                  <Trash2 className={ui.iconSm} aria-hidden />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
