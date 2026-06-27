"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ban,
  BarChart3,
  Copy,
  Download,
  KeyRound,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import DailyEncodeTracker, { type DailyEncodeStat } from "@/components/admin/DailyEncodeTracker";
import { exportFacedToExcel } from "@/lib/export-excel";
import type { FacedRecord } from "@/lib/faced-types";
import { normalizeEnumeratorName } from "@/lib/enumerator-name";
import { SARANGANI_MUNICIPALITIES } from "@/lib/sarangani-locations";
import {
  SkeletonChart,
  SkeletonScreen,
  SkeletonStatGrid,
  SkeletonTable,
} from "@/components/ui/Skeleton";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

const ADMIN_STORAGE_KEY = "dms_admin_password";
const PAGE_SIZE = 20;
const STATS_URL = "/api/dashboard/encoding-summary";

type EnumeratorSummary = {
  access_code: string;
  enumerator_name: string;
  enumerator_email: string | null;
  total_encoded: number;
  total_codes: number;
  active_codes: number;
  used_codes: number;
  rejected_codes: number;
  last_encoded_at: string | null;
  last_used_at: string | null;
};

type EnumeratorSummaryTotals = {
  enumerators: number;
  total_encoded: number;
  total_codes: number;
  active_codes: number;
  used_codes: number;
  rejected_codes: number;
};

type RecordsAdminMetrics = {
  duplicate_group_count: number;
  duplicate_record_count: number;
  soft_deleted_count: number;
};

type ExportRecordJson = Omit<FacedRecord, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function slugify(value: string): string {
  return value
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 40);
}

function toFacedRecords(records: ExportRecordJson[]): FacedRecord[] {
  return records.map((record) => ({
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }));
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function SummaryPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const pages = totalPages(totalItems, pageSize);
  if (totalItems <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-faced-blue-border px-4 py-3">
      <p className="text-xs text-zinc-600">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(ui.btnSecondary, "text-xs disabled:cursor-not-allowed disabled:opacity-50")}
        >
          Previous
        </button>
        <span className="text-xs text-zinc-600">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className={cn(ui.btnSecondary, "text-xs disabled:cursor-not-allowed disabled:opacity-50")}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default function EnumeratorSummaryPanel() {
  const [summaries, setSummaries] = useState<EnumeratorSummary[]>([]);
  const [summaryTotals, setSummaryTotals] = useState<EnumeratorSummaryTotals | null>(null);
  const [recordsMetrics, setRecordsMetrics] = useState<RecordsAdminMetrics | null>(null);
  const [dailyEncode, setDailyEncode] = useState<DailyEncodeStat[]>([]);
  const [statsMunicipality, setStatsMunicipality] = useState("");
  const [statsLoading, setStatsLoading] = useState(false);
  const [summaryPage, setSummaryPage] = useState(1);
  const [exportingCode, setExportingCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [canExport, setCanExport] = useState(false);

  useEffect(() => {
    setCanExport(Boolean(sessionStorage.getItem(ADMIN_STORAGE_KEY)));
  }, []);

  const adminFetch = useCallback(async (path: string, init?: RequestInit) => {
    const password = sessionStorage.getItem(ADMIN_STORAGE_KEY) ?? "";
    return fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
        ...init?.headers,
      },
    });
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (statsMunicipality.trim()) {
        params.set("municipality", statsMunicipality.trim());
      }
      const query = params.toString();
      const res = await fetch(`${STATS_URL}${query ? `?${query}` : ""}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load encoding summary.");
      }
      setSummaries(data.summaries || []);
      setSummaryTotals(data.totals || null);
      setRecordsMetrics(data.records || null);
      setDailyEncode(data.daily_encode || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load encoding summary.");
    } finally {
      setStatsLoading(false);
    }
  }, [statsMunicipality]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    setSummaryPage(1);
  }, [summaries]);

  const paginatedSummaries = useMemo(
    () => paginate(summaries, summaryPage, PAGE_SIZE),
    [summaries, summaryPage],
  );

  async function handleExportEnumerator(accessCode?: string, label?: string) {
    const exportKey = accessCode ?? "all";
    setMessage("");
    setError("");
    setExportingCode(exportKey);

    try {
      const res = await adminFetch("/api/admin/export", {
        method: "POST",
        body: JSON.stringify(accessCode ? { access_code: accessCode } : {}),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Export failed.");
      }

      const records = toFacedRecords((data.records ?? []) as ExportRecordJson[]);
      if (records.length === 0) {
        setMessage(
          accessCode
            ? `No synced records found for ${label ?? accessCode}.`
            : "No synced records found for any enumerator.",
        );
        return;
      }

      const date = new Date().toISOString().slice(0, 10);
      const filename = accessCode
        ? `FACED_${slugify(label ?? accessCode)}.xlsx`
        : `FACED_all_enumerators_${date}.xlsx`;
      exportFacedToExcel(records, filename);
      setMessage(`Downloaded ${records.length} record(s).`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportingCode(null);
    }
  }

  return (
    <section className={ui.card}>
      <div className={cn(ui.sectionHeader, "flex flex-wrap items-center justify-between gap-2")}>
        <span>Enumerator summary</span>
        <div className="flex flex-wrap items-center gap-3">
          {canExport ? (
            <button
              type="button"
              onClick={() => void handleExportEnumerator()}
              disabled={exportingCode !== null || statsLoading}
              className={cn("text-xs font-normal normal-case tracking-normal underline", ui.withIcon)}
            >
              <Download className={ui.iconSm} aria-hidden />
              {exportingCode === "all" ? "Exporting..." : "Export all to Excel"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void loadStats()}
            disabled={statsLoading}
            className={cn("text-xs font-normal normal-case tracking-normal underline", ui.withIcon)}
          >
            <RefreshCw className={cn(ui.iconSm, statsLoading && "animate-spin")} aria-hidden />
            Refresh
          </button>
        </div>
      </div>

      <div className={cn(ui.sectionBody, "space-y-4")}>
        {(message || error) && (
          <div className={error ? ui.alertError : ui.alertSuccess}>{error || message}</div>
        )}

        {!canExport ? (
          <p className="text-xs text-zinc-600">
            Excel export requires admin login (unlock Admin or Records first).
          </p>
        ) : null}

        <div className="border-b border-faced-blue-border bg-ph-blue-light/50 px-4 py-3">
          <label className="block max-w-xs">
            <span className={ui.label}>Municipality</span>
            <select
              className={cn(ui.input, "mt-1")}
              value={statsMunicipality}
              onChange={(e) => setStatsMunicipality(e.target.value)}
              disabled={statsLoading}
            >
              <option value="">All municipalities</option>
              {SARANGANI_MUNICIPALITIES.map((municipality) => (
                <option key={municipality} value={municipality}>
                  {municipality}
                </option>
              ))}
            </select>
          </label>
        </div>

        {statsLoading && summaries.length === 0 ? (
          <SkeletonScreen label="Loading enumerator summary">
            <SkeletonStatGrid count={6} />
            <SkeletonChart />
            <SkeletonTable rows={5} columns={10} />
          </SkeletonScreen>
        ) : summaryTotals ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-faced-blue-border bg-ph-blue-light/40 px-4 py-3">
              <p className={cn("text-xs font-bold uppercase tracking-wide text-ph-blue-dark", ui.withIcon)}>
                <BarChart3 className={ui.iconSm} aria-hidden />
                Total encoded
              </p>
              <p className="mt-1 text-2xl font-bold text-ph-blue-dark">{summaryTotals.total_encoded}</p>
              <p className="text-xs text-zinc-600">Synced FACED records online</p>
            </div>
            <div className="rounded-lg border border-faced-blue-border bg-white px-4 py-3">
              <p className={cn("text-xs font-bold uppercase tracking-wide text-zinc-600", ui.withIcon)}>
                <Users className={ui.iconSm} aria-hidden />
                Enumerators
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{summaryTotals.enumerators}</p>
              <p className="text-xs text-zinc-600">One access code per enumerator</p>
            </div>
            <div className="rounded-lg border border-faced-blue-border bg-white px-4 py-3">
              <p className={cn("text-xs font-bold uppercase tracking-wide text-zinc-600", ui.withIcon)}>
                <KeyRound className={ui.iconSm} aria-hidden />
                Access codes
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{summaryTotals.total_codes}</p>
              <p className="text-xs text-zinc-600">
                {summaryTotals.active_codes} active · {summaryTotals.used_codes} used
              </p>
            </div>
            <div className="rounded-lg border border-faced-blue-border bg-white px-4 py-3">
              <p className={cn("text-xs font-bold uppercase tracking-wide text-zinc-600", ui.withIcon)}>
                <Ban className={ui.iconSm} aria-hidden />
                Rejected codes
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">{summaryTotals.rejected_codes}</p>
              <p className="text-xs text-zinc-600">No longer valid for login</p>
            </div>
            <Link
              href="/records"
              className="rounded-lg border border-amber-300/70 bg-ph-yellow-light/50 px-4 py-3 transition-colors hover:bg-ph-yellow-light/80"
            >
              <p className={cn("text-xs font-bold uppercase tracking-wide text-amber-900", ui.withIcon)}>
                <Copy className={ui.iconSm} aria-hidden />
                Duplicates
              </p>
              <p className="mt-1 text-2xl font-bold text-ph-blue-dark">
                {recordsMetrics?.duplicate_group_count ?? 0}
              </p>
              <p className="text-xs text-amber-900/80">
                {recordsMetrics?.duplicate_record_count ?? 0} records with matching names
              </p>
            </Link>
            <Link
              href="/records"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 transition-colors hover:bg-red-100/80"
            >
              <p className={cn("text-xs font-bold uppercase tracking-wide text-red-800", ui.withIcon)}>
                <Trash2 className={ui.iconSm} aria-hidden />
                Deleted
              </p>
              <p className="mt-1 text-2xl font-bold text-red-900">
                {recordsMetrics?.soft_deleted_count ?? 0}
              </p>
              <p className="text-xs text-red-800/80">Hidden from lists and duplicate checks</p>
            </Link>
          </div>
        ) : null}

        <DailyEncodeTracker data={dailyEncode} loading={statsLoading} />

        <div className="hidden overflow-x-auto lg:block">
          <table className={cn(ui.table, "w-full min-w-[880px] text-sm")}>
            <thead>
              <tr>
                <th>Enumerator</th>
                <th>Email</th>
                <th>Encoded</th>
                <th>Codes</th>
                <th>Active</th>
                <th>Used</th>
                <th>Rejected</th>
                <th>Last encoded</th>
                <th>Last used</th>
                {canExport ? <th></th> : null}
              </tr>
            </thead>
            <tbody>
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={canExport ? 10 : 9} className="p-4 text-center text-zinc-500">
                    No enumerator activity yet.
                  </td>
                </tr>
              ) : (
                paginatedSummaries.map((row) => (
                  <tr key={row.access_code}>
                    <td className="font-medium">
                      <div>{normalizeEnumeratorName(row.enumerator_name) ?? "—"}</div>
                      <div className="text-xs font-normal text-zinc-500">{row.access_code}</div>
                    </td>
                    <td className="text-zinc-600">{row.enumerator_email || "—"}</td>
                    <td className="font-semibold text-ph-blue-dark">{row.total_encoded}</td>
                    <td>{row.total_codes}</td>
                    <td>{row.active_codes}</td>
                    <td>{row.used_codes}</td>
                    <td>{row.rejected_codes}</td>
                    <td className="text-xs text-zinc-600">{formatDate(row.last_encoded_at)}</td>
                    <td className="text-xs text-zinc-600">{formatDate(row.last_used_at)}</td>
                    {canExport ? (
                      <td className="whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() =>
                            void handleExportEnumerator(row.access_code, row.enumerator_name)
                          }
                          disabled={exportingCode !== null || row.total_encoded === 0}
                          className={cn(ui.link, "text-xs disabled:cursor-not-allowed disabled:opacity-50")}
                        >
                          {exportingCode === row.access_code ? "Exporting..." : "Export"}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <SummaryPagination
          page={summaryPage}
          totalItems={summaries.length}
          pageSize={PAGE_SIZE}
          onPageChange={setSummaryPage}
        />
      </div>
    </section>
  );
}
