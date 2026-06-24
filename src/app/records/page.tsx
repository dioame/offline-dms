"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import type {
  DuplicateGroup,
  FacedRecordAdminDetail,
  FacedRecordListItem,
} from "@/lib/records-admin";
import SoftDeleteConfirmDialog from "@/components/records/SoftDeleteConfirmDialog";
import FacedRecordViewModal from "@/components/records/FacedRecordViewModal";
import RecordRowActions from "@/components/records/RecordRowActions";
import TrashRowActions from "@/components/records/TrashRowActions";
import RestoreConfirmDialog from "@/components/records/RestoreConfirmDialog";
import {
  buildOfflineDmsPrintBundle,
  buildOfflineDmsPrintMap,
} from "@/lib/print/offlineDmsFacedPrint";
import { openFacedFormPrint } from "@/lib/print/openFacedFormPrint";
import { exportFacedToExcel, exportRecordsJsonToFacedRecords, type ExportRecordJson } from "@/lib/export-excel";

const ADMIN_STORAGE_KEY = "dms_admin_password";
const PAGE_SIZE = 25;

type RecordsTab = "records" | "duplicates" | "trash";

function formatWhen(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

function duplicateRecordHaystack(row: FacedRecordListItem): string {
  return [
    row.headName,
    row.firstName,
    row.middleName,
    row.lastName,
    row.barangay,
    row.city_municipality,
    row.province,
    row.enumerator_name,
    row.birthdate,
    row.uuid,
    row.access_code,
    row.date_registered,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function filterDuplicateGroups(groups: DuplicateGroup[], query: string): DuplicateGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => {
      const groupHaystack = `${group.first_name} ${group.last_name}`.toLowerCase();
      const groupMatches = groupHaystack.includes(q);
      const records = groupMatches
        ? group.records
        : group.records.filter((row) => duplicateRecordHaystack(row).includes(q));

      if (records.length === 0) return null;

      return {
        ...group,
        count: records.length,
        records,
      };
    })
    .filter((group): group is DuplicateGroup => group !== null);
}

export default function RecordsPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<RecordsTab>("records");

  const [records, setRecords] = useState<FacedRecordListItem[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [duplicateStats, setDuplicateStats] = useState({ groupCount: 0, totalDuplicates: 0 });
  const [duplicateSearch, setDuplicateSearch] = useState("");
  const [duplicateSearchInput, setDuplicateSearchInput] = useState("");

  const [trashRecords, setTrashRecords] = useState<FacedRecordListItem[]>([]);
  const [totalTrash, setTotalTrash] = useState(0);
  const [trashPage, setTrashPage] = useState(1);
  const [trashSearch, setTrashSearch] = useState("");
  const [trashSearchInput, setTrashSearchInput] = useState("");

  const [viewRecord, setViewRecord] = useState<FacedRecordAdminDetail | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ uuid: string; headName: string } | null>(
    null,
  );
  const [restoreTarget, setRestoreTarget] = useState<{ uuid: string; headName: string } | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [printingUuid, setPrintingUuid] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    if (stored) {
      setPassword(stored);
      setUnlocked(true);
    }
  }, []);

  const adminFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY) || password;
      return fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": stored,
          ...init?.headers,
        },
      });
    },
    [password],
  );

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
        search,
      });
      const res = await adminFetch(`/api/admin/records?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load records.");
      setRecords(data.records || []);
      setTotalRecords(Number(data.total ?? 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load records.");
      if (err instanceof Error && err.message === "Unauthorized") {
        setUnlocked(false);
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } finally {
      setLoading(false);
    }
  }, [adminFetch, page, search]);

  const loadDuplicates = useCallback(async () => {
    setDuplicatesLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/records/duplicates");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load duplicates.");
      setDuplicateGroups(data.groups || []);
      setDuplicateStats({
        groupCount: Number(data.groupCount ?? 0),
        totalDuplicates: Number(data.totalDuplicates ?? 0),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load duplicates.");
      if (err instanceof Error && err.message === "Unauthorized") {
        setUnlocked(false);
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } finally {
      setDuplicatesLoading(false);
    }
  }, [adminFetch]);

  const loadTrashCount = useCallback(async () => {
    try {
      const res = await adminFetch("/api/admin/records?scope=trash&page=1&pageSize=1");
      const data = await res.json();
      if (!res.ok) {
        console.error("Trash count failed:", data.error);
        return;
      }
      setTotalTrash(Number(data.total ?? 0));
    } catch (err) {
      console.error("Trash count failed:", err);
    }
  }, [adminFetch]);

  const loadTrash = useCallback(async () => {
    setTrashLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(trashPage),
        pageSize: String(PAGE_SIZE),
        search: trashSearch,
      });
      const res = await adminFetch(`/api/admin/records?scope=trash&${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load trash.");
      setTrashRecords(data.records || []);
      setTotalTrash(Number(data.total ?? 0));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load trash.");
      if (err instanceof Error && err.message === "Unauthorized") {
        setUnlocked(false);
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } finally {
      setTrashLoading(false);
    }
  }, [adminFetch, trashPage, trashSearch]);

  useEffect(() => {
    if (!unlocked) return;
    void loadRecords();
    void loadDuplicates();
    void loadTrashCount();
  }, [unlocked, loadRecords, loadDuplicates, loadTrashCount]);

  useEffect(() => {
    if (!unlocked || activeTab !== "records") return;
    void loadRecords();
  }, [unlocked, activeTab, page, search, loadRecords]);

  useEffect(() => {
    if (!unlocked || activeTab !== "duplicates") return;
    void loadDuplicates();
  }, [unlocked, activeTab, loadDuplicates]);

  useEffect(() => {
    if (!unlocked || activeTab !== "trash") return;
    void loadTrash();
  }, [unlocked, activeTab, trashPage, trashSearch, loadTrash]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setTrashPage(1);
  }, [trashSearch]);

  const pages = useMemo(() => totalPages(totalRecords, PAGE_SIZE), [totalRecords]);
  const trashPages = useMemo(() => totalPages(totalTrash, PAGE_SIZE), [totalTrash]);

  const filteredDuplicateGroups = useMemo(
    () => filterDuplicateGroups(duplicateGroups, duplicateSearch),
    [duplicateGroups, duplicateSearch],
  );

  const filteredDuplicateStats = useMemo(() => {
    const groupCount = filteredDuplicateGroups.length;
    const totalDuplicates = filteredDuplicateGroups.reduce((sum, group) => sum + group.count, 0);
    return { groupCount, totalDuplicates };
  }, [filteredDuplicateGroups]);

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/records?page=1&pageSize=1", {
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid admin password.");
      sessionStorage.setItem(ADMIN_STORAGE_KEY, password);
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleLock() {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    setUnlocked(false);
    setRecords([]);
    setDuplicateGroups([]);
    setTrashRecords([]);
    setViewRecord(null);
  }

  async function handleExportExcel() {
    setMessage("");
    setError("");
    setExporting(true);
    try {
      const res = await adminFetch("/api/admin/export", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Export failed.");

      const records = exportRecordsJsonToFacedRecords((data.records ?? []) as ExportRecordJson[]);
      if (records.length === 0) {
        setMessage("No synced records to export.");
        return;
      }

      const date = new Date().toISOString().slice(0, 10);
      exportFacedToExcel(records, `FACED_records_${date}.xlsx`);
      setMessage(`Exported ${records.length} record(s) to Excel.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  function goToEdit(uuid: string) {
    router.push(`/records/${uuid}/edit`);
  }

  async function openView(uuid: string, scope: "active" | "trash" = "active") {
    setMessage("");
    setError("");
    try {
      const query = scope === "trash" ? "?scope=trash" : "";
      const res = await adminFetch(`/api/admin/records/${uuid}${query}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load record.");
      setViewRecord(data.record);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load record.");
    }
  }

  function requestRestore(uuid: string, headName: string) {
    setMessage("");
    setError("");
    setRestoreTarget({ uuid, headName });
  }

  async function confirmRestore() {
    if (!restoreTarget) return;

    const { uuid } = restoreTarget;
    setRestoring(true);
    setMessage("");
    setError("");
    try {
      const res = await adminFetch(`/api/admin/records/${uuid}/restore`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore record.");
      setMessage("Record restored.");
      setRestoreTarget(null);
      if (viewRecord?.uuid === uuid) setViewRecord(null);
      await Promise.all([loadRecords(), loadDuplicates(), loadTrash()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restore failed.");
    } finally {
      setRestoring(false);
    }
  }

  function requestDelete(uuid: string, headName: string) {
    setMessage("");
    setError("");
    setDeleteTarget({ uuid, headName });
  }

  async function handlePrint(uuid: string, headName: string) {
    setMessage("");
    setError("");
    setPrintingUuid(uuid);
    try {
      const res = await adminFetch(`/api/admin/records/${uuid}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load record for printing.");
      const record = data.record as FacedRecordAdminDetail;
      const { head } = buildOfflineDmsPrintBundle(record);
      const opened = openFacedFormPrint(
        [head],
        buildOfflineDmsPrintMap(record),
        `FACED Form — ${headName}`,
      );
      if (!opened) {
        throw new Error("Pop-up blocked. Allow pop-ups for this site, then try Print FACED again.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Print failed.");
    } finally {
      setPrintingUuid(null);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    const { uuid } = deleteTarget;
    setDeleting(true);
    setMessage("");
    setError("");
    try {
      const res = await adminFetch(`/api/admin/records/${uuid}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete record.");
      setMessage("Record deleted.");
      setDeleteTarget(null);
      if (viewRecord?.uuid === uuid) setViewRecord(null);
      await Promise.all([loadRecords(), loadDuplicates(), loadTrashCount()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setDeleting(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="ph-page-bg flex min-h-full flex-col">
        <div className="ph-app-header py-5 text-center">
          <BrandEmblem size={72} className="mx-auto mb-2" />
          <p className="ph-kicker text-xs font-bold uppercase">Administration</p>
          <h1 className="text-xl font-bold text-white">FACED Records</h1>
          <TricolorBar thick className="mx-auto mt-4 max-w-xs" />
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="ph-login-card ph-card w-full max-w-md">
            <div className="faced-section-header justify-center">Admin access</div>
            <div className="faced-section-body space-y-4 rounded-b-xl border-b border-[var(--faced-blue-border)]">
              <p className="text-sm text-zinc-600">
                Enter the admin password to view, update, or delete synced FACED records.
              </p>
              <form onSubmit={(e) => void handleUnlock(e)} className="space-y-3">
                <label className="block">
                  <span className="faced-label">Admin password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="faced-input"
                    autoFocus
                    required
                  />
                </label>
                {error && <p className="ph-alert-error">{error}</p>}
                <button type="submit" className="faced-btn-primary w-full" disabled={loading}>
                  {loading ? "Verifying..." : "Unlock records"}
                </button>
              </form>
              <p className="text-center text-xs text-zinc-500">
                <Link href="/admin" className="ph-link">
                  Back to admin
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ph-page-bg min-h-full">
      <header className="ph-app-header">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BrandEmblem size={52} className="hidden shrink-0 sm:block" />
            <div>
              <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
              <h1 className="text-xl font-bold text-white">FACED records (RUD)</h1>
              <p className="ph-subtitle text-sm">
                Read, update, and delete synced FACED forms. Export, review duplicates, or restore from trash.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handleLock} className="ph-header-btn ph-header-btn--danger">
              Lock
            </button>
          </div>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {(message || error) && (
          <div className={error ? "ph-alert-error" : "ph-alert-success"}>{error || message}</div>
        )}

        <div className="verify-tabs" role="tablist" aria-label="Records views">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "records"}
            className={`verify-tab ${activeTab === "records" ? "verify-tab--active" : ""}`}
            onClick={() => setActiveTab("records")}
          >
            All records ({totalRecords})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "duplicates"}
            className={`verify-tab ${activeTab === "duplicates" ? "verify-tab--active" : ""}`}
            onClick={() => setActiveTab("duplicates")}
          >
            Duplicates ({duplicateStats.groupCount || duplicateGroups.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "trash"}
            className={`verify-tab ${activeTab === "trash" ? "verify-tab--active" : ""}`}
            onClick={() => setActiveTab("trash")}
          >
            Trash ({totalTrash})
          </button>
        </div>

        {activeTab === "records" ? (
          <section className="ph-card">
            <div className="faced-section-header flex flex-wrap items-center justify-between gap-2">
              <span>Synced FACED records</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleExportExcel()}
                  disabled={exporting || loading}
                  className="record-action-btn record-action-btn--print normal-case tracking-normal"
                >
                  {exporting ? "Exporting…" : "Export Excel"}
                </button>
                <button
                  type="button"
                  onClick={() => void loadRecords()}
                  disabled={loading}
                  className="text-xs font-normal normal-case tracking-normal underline"
                >
                  Refresh
                </button>
              </div>
            </div>
            <div className="border-b border-[var(--faced-blue-border)] bg-[var(--ph-blue-light)]/50 px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearch(searchInput.trim());
                }}
                className="flex flex-wrap gap-2"
              >
                <input
                  type="search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search name, barangay, encoder, UUID..."
                  className="faced-input min-w-[16rem] flex-1"
                />
                <button type="submit" className="faced-btn-secondary text-sm">
                  Search
                </button>
              </form>
            </div>
            <div className="faced-section-body overflow-x-auto p-0">
              <table className="faced-table w-full min-w-[980px] text-sm">
                <thead>
                  <tr>
                    <th>Head of family</th>
                    <th>Location</th>
                    <th>Encoder</th>
                    <th>Registered</th>
                    <th>Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-zinc-500">
                        Loading records...
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-zinc-500">
                        No synced records found.
                      </td>
                    </tr>
                  ) : (
                    records.map((row) => (
                      <tr key={row.uuid}>
                        <td>
                          <div className="font-medium">{row.headName}</div>
                          <div className="text-xs text-zinc-500">{row.birthdate || "—"}</div>
                        </td>
                        <td className="text-zinc-700">
                          {[row.barangay, row.city_municipality].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="text-zinc-700">{row.enumerator_name || "—"}</td>
                        <td className="text-xs text-zinc-600">{row.date_registered || "—"}</td>
                        <td className="text-xs text-zinc-600">{formatWhen(row.updated_at)}</td>
                        <td className="text-right">
                          <RecordRowActions
                            onView={() => void openView(row.uuid)}
                            onEdit={() => goToEdit(row.uuid)}
                            onPrint={() => void handlePrint(row.uuid, row.headName)}
                            onDelete={() => requestDelete(row.uuid, row.headName)}
                            printing={printingUuid === row.uuid}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalRecords > PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--faced-blue-border)] px-4 py-3">
                <p className="text-xs text-zinc-600">
                  Page {page} of {pages} · {totalRecords} total
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loading}
                    className="faced-btn-secondary text-xs disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages || loading}
                    className="faced-btn-secondary text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        ) : activeTab === "duplicates" ? (
          <section className="ph-card">
            <div className="faced-section-header flex flex-wrap items-center justify-between gap-2">
              <span>
                Possible duplicates ({filteredDuplicateStats.groupCount} groups ·{" "}
                {filteredDuplicateStats.totalDuplicates} records
                {duplicateSearch.trim() &&
                (filteredDuplicateStats.groupCount !== duplicateStats.groupCount ||
                  filteredDuplicateStats.totalDuplicates !== duplicateStats.totalDuplicates)
                  ? ` · filtered from ${duplicateStats.groupCount} groups`
                  : ""}
                )
              </span>
              <button
                type="button"
                onClick={() => void loadDuplicates()}
                disabled={duplicatesLoading}
                className="text-xs font-normal normal-case tracking-normal underline"
              >
                Refresh
              </button>
            </div>
            <div className="border-b border-[var(--faced-blue-border)] bg-[var(--ph-blue-light)]/50 px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setDuplicateSearch(duplicateSearchInput.trim());
                }}
                className="flex flex-wrap gap-2"
              >
                <input
                  type="search"
                  value={duplicateSearchInput}
                  onChange={(e) => setDuplicateSearchInput(e.target.value)}
                  placeholder="Search name, barangay, encoder, birthdate..."
                  className="faced-input min-w-[16rem] flex-1"
                />
                <button type="submit" className="faced-btn-secondary text-sm">
                  Search
                </button>
                {duplicateSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDuplicateSearch("");
                      setDuplicateSearchInput("");
                    }}
                    className="faced-btn-secondary text-sm"
                  >
                    Clear
                  </button>
                ) : null}
              </form>
            </div>
            <div className="faced-section-body space-y-4">
              {duplicatesLoading && duplicateGroups.length === 0 ? (
                <p className="text-sm text-zinc-500">Loading duplicates...</p>
              ) : duplicateGroups.length === 0 ? (
                <p className="text-sm text-zinc-500">No duplicate names found in synced records.</p>
              ) : filteredDuplicateGroups.length === 0 ? (
                <p className="text-sm text-zinc-500">No duplicates match your search.</p>
              ) : (
                filteredDuplicateGroups.map((group) => (
                  <article
                    key={group.key}
                    className="overflow-hidden rounded-lg border border-amber-300/60 bg-[var(--ph-yellow-light)]/40"
                  >
                    <div className="border-b border-amber-300/40 bg-amber-100/50 px-4 py-2">
                      <p className="font-bold text-[var(--ph-blue-dark)]">
                        {group.last_name}, {group.first_name}
                      </p>
                      <p className="text-xs text-amber-900/80">
                        {group.count} records with the same first and last name
                      </p>
                    </div>
                    <ul className="divide-y divide-amber-200/60">
                      {group.records.map((row) => (
                        <li
                          key={row.uuid}
                          className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm"
                        >
                          <div>
                            <span className="font-medium">{row.headName}</span>
                            <span className="text-zinc-600">
                              {" "}
                              · {[row.barangay, row.city_municipality].filter(Boolean).join(", ")}
                              {row.birthdate ? ` · ${row.birthdate}` : ""}
                              {row.enumerator_name ? ` · Encoder: ${row.enumerator_name}` : ""}
                            </span>
                          </div>
                          <RecordRowActions
                            onView={() => void openView(row.uuid)}
                            onEdit={() => goToEdit(row.uuid)}
                            onPrint={() => void handlePrint(row.uuid, row.headName)}
                            onDelete={() => requestDelete(row.uuid, row.headName)}
                            printing={printingUuid === row.uuid}
                          />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : (
          <section className="ph-card">
            <div className="faced-section-header flex flex-wrap items-center justify-between gap-2">
              <span>Deleted records ({totalTrash})</span>
              <button
                type="button"
                onClick={() => void loadTrash()}
                disabled={trashLoading}
                className="text-xs font-normal normal-case tracking-normal underline"
              >
                Refresh
              </button>
            </div>
            <div className="border-b border-[var(--faced-blue-border)] bg-[var(--ph-blue-light)]/50 px-4 py-3">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setTrashSearch(trashSearchInput.trim());
                }}
                className="flex flex-wrap gap-2"
              >
                <input
                  type="search"
                  value={trashSearchInput}
                  onChange={(e) => setTrashSearchInput(e.target.value)}
                  placeholder="Search deleted records..."
                  className="faced-input min-w-[16rem] flex-1"
                />
                <button type="submit" className="faced-btn-secondary text-sm">
                  Search
                </button>
                {trashSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTrashSearch("");
                      setTrashSearchInput("");
                    }}
                    className="faced-btn-secondary text-sm"
                  >
                    Clear
                  </button>
                ) : null}
              </form>
            </div>
            <div className="faced-section-body overflow-x-auto p-0">
              <table className="faced-table w-full min-w-[900px] text-sm">
                <thead>
                  <tr>
                    <th>Head of family</th>
                    <th>Location</th>
                    <th>Encoder</th>
                    <th>Deleted</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trashLoading && trashRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-zinc-500">
                        Loading trash...
                      </td>
                    </tr>
                  ) : trashRecords.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-zinc-500">
                        No deleted records in trash.
                      </td>
                    </tr>
                  ) : (
                    trashRecords.map((row) => (
                      <tr key={row.uuid}>
                        <td>
                          <div className="font-medium">{row.headName}</div>
                          <div className="text-xs text-zinc-500">{row.birthdate || "—"}</div>
                        </td>
                        <td className="text-zinc-700">
                          {[row.barangay, row.city_municipality].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="text-zinc-700">{row.enumerator_name || "—"}</td>
                        <td className="text-xs text-zinc-600">
                          {formatWhen(row.deleted_at ?? row.updated_at)}
                        </td>
                        <td className="text-right">
                          <TrashRowActions
                            onView={() => void openView(row.uuid, "trash")}
                            onRestore={() => requestRestore(row.uuid, row.headName)}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalTrash > PAGE_SIZE && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--faced-blue-border)] px-4 py-3">
                <p className="text-xs text-zinc-600">
                  Page {trashPage} of {trashPages} · {totalTrash} total
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTrashPage((p) => Math.max(1, p - 1))}
                    disabled={trashPage <= 1 || trashLoading}
                    className="faced-btn-secondary text-xs disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrashPage((p) => Math.min(trashPages, p + 1))}
                    disabled={trashPage >= trashPages || trashLoading}
                    className="faced-btn-secondary text-xs disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      {viewRecord && (
        <FacedRecordViewModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
          onEdit={() => {
            const uuid = viewRecord.uuid;
            setViewRecord(null);
            goToEdit(uuid);
          }}
        />
      )}

      <SoftDeleteConfirmDialog
        open={deleteTarget !== null}
        headName={deleteTarget?.headName ?? ""}
        deleting={deleting}
        onNo={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onYes={() => void confirmDelete()}
      />

      <RestoreConfirmDialog
        open={restoreTarget !== null}
        headName={restoreTarget?.headName ?? ""}
        restoring={restoring}
        onNo={() => {
          if (!restoring) setRestoreTarget(null);
        }}
        onYes={() => void confirmRestore()}
      />
    </div>
  );
}
