"use client";

import { useCallback, useEffect, useState } from "react";
import { deleteFacedRecord, getFacedRecords } from "@/lib/db";
import { exportFacedToExcel } from "@/lib/export-excel";
import { syncPendingRecords } from "@/lib/sync-client";
import type { FacedRecord, SyncStatus } from "@/lib/faced-types";

type FacedRecordListProps = {
  refreshKey: number;
  onEdit: (id: number) => void;
  onSynced?: () => void;
};

function headName(record: FacedRecord): string {
  const h = record.head_of_family;
  return [h.first_name, h.middle_name, h.last_name].filter(Boolean).join(" ");
}

function syncBadge(status: SyncStatus) {
  const styles: Record<SyncStatus, string> = {
    pending: "ph-badge-pending",
    synced: "ph-badge-synced",
    failed: "ph-badge-failed",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${styles[status]}`}
    >
      {status}
    </span>
  );
}

export default function FacedRecordList({ refreshKey, onEdit, onSynced }: FacedRecordListProps) {
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
      <p className="text-sm font-medium text-[var(--ph-blue)]">Loading records...</p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as "all" | SyncStatus)}
          className="faced-input w-auto text-sm"
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
          className="faced-btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-60"
        >
          {syncing ? "Syncing online..." : `Sync online (${pendingCount})`}
        </button>
        <button
          type="button"
          onClick={() => handleExport("all")}
          className="faced-btn-secondary text-sm"
        >
          Export all to Excel
        </button>
        <button
          type="button"
          onClick={() => handleExport("pending")}
          className="faced-btn-secondary text-sm"
        >
          Export unsynced
        </button>
      </div>

      {syncMessage && (
        <p
          className={
            syncMessage.includes("Successfully") ? "ph-alert-success" : "ph-alert-warning"
          }
          role="status"
        >
          {syncMessage}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[var(--faced-blue-border)] bg-white px-4 py-10 text-center text-sm text-zinc-500 shadow-sm">
          No FACED records yet. Fill out the form above to add the first record.
        </p>
      ) : (
        <ul className="ph-card divide-y divide-[var(--faced-blue-border)]">
          {filtered.map((record) => (
            <li
              key={record.id}
              className="flex items-start justify-between gap-4 px-4 py-3.5 transition-colors hover:bg-[var(--ph-blue-light)]/40"
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
                  className="ph-link text-sm"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => record.id && void handleDelete(record.id)}
                  className="text-sm font-semibold text-[var(--ph-red)] hover:underline"
                >
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
