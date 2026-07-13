"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FolderOpen,
  KeyRound,
  LayoutDashboard,
  Loader2,
  Lock,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Sparkles,
  Tent,
} from "lucide-react";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import EcLibraryPanel from "@/components/admin/EcLibraryPanel";
import { exportAccessCodesToExcel } from "@/lib/export-excel";
import { normalizeEnumeratorName } from "@/lib/enumerator-name";
import { SkeletonScreen, SkeletonTable } from "@/components/ui/Skeleton";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type AccessCodeRow = {
  code: string;
  status: "active" | "used" | "rejected";
  created_at: string;
  rejected_at: string | null;
  used_at: string | null;
  session_id: string | null;
  last_used_at: string | null;
  enumerator_name: string | null;
  enumerator_email: string | null;
};

type AssigneeDraft = {
  enumerator_name: string;
  enumerator_email: string;
};

const ADMIN_STORAGE_KEY = "dms_admin_password";
const PAGE_SIZE = 20;

type AdminTab = "create" | "codes" | "ec-library";

const ADMIN_TABS: {
  id: AdminTab;
  label: string;
  mobileLabel?: string;
  icon: typeof Sparkles;
}[] = [
  { id: "create", label: "Create codes", mobileLabel: "Create", icon: Sparkles },
  { id: "codes", label: "Manage codes", mobileLabel: "Manage", icon: KeyRound },
  { id: "ec-library", label: "EC Library", icon: Tent },
];

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

type AdminPaginationProps = {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function AdminPagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
}: AdminPaginationProps) {
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
          className={cn(ui.btnSecondary, "text-xs disabled:cursor-not-allowed disabled:opacity-50", ui.withIcon)}
        >
          <ChevronLeft className={ui.iconSm} aria-hidden />
          Previous
        </button>
        <span className="text-xs text-zinc-600">
          Page {page} of {pages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className={cn(ui.btnSecondary, "text-xs disabled:cursor-not-allowed disabled:opacity-50", ui.withIcon)}
        >
          Next
          <ChevronRight className={ui.iconSm} aria-hidden />
        </button>
      </div>
    </div>
  );
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function draftsFromCodes(codes: AccessCodeRow[]): Record<string, AssigneeDraft> {
  return Object.fromEntries(
    codes.map((row) => [
      row.code,
      {
        enumerator_name: normalizeEnumeratorName(row.enumerator_name) ?? "",
        enumerator_email: row.enumerator_email ?? "",
      },
    ]),
  );
}

function draftChanged(row: AccessCodeRow, draft: AssigneeDraft): boolean {
  return (
    draft.enumerator_name.trim() !== (normalizeEnumeratorName(row.enumerator_name) ?? "") ||
    draft.enumerator_email.trim() !== (row.enumerator_email ?? "").trim()
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [codes, setCodes] = useState<AccessCodeRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AssigneeDraft>>({});
  const [savingCode, setSavingCode] = useState<string | null>(null);
  const [generateCount, setGenerateCount] = useState(5);
  const [customCode, setCustomCode] = useState("");
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [search, setSearch] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [codesPage, setCodesPage] = useState(1);
  const [activeTab, setActiveTab] = useState<AdminTab>("create");

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

  const loadCodes = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/admin/codes");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load codes.");
      }
      const rows: AccessCodeRow[] = data.codes || [];
      setCodes(rows);
      setDrafts(draftsFromCodes(rows));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load codes.");
      if (err instanceof Error && err.message === "Unauthorized") {
        setUnlocked(false);
        sessionStorage.removeItem(ADMIN_STORAGE_KEY);
      }
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  const refreshAdminData = useCallback(async () => {
    await loadCodes();
  }, [loadCodes]);

  useEffect(() => {
    if (!unlocked) return;
    void loadCodes();
  }, [unlocked, loadCodes]);

  const filteredCodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return codes;
    return codes.filter((row) => {
      const draft = drafts[row.code];
      return (
        row.code.toLowerCase().includes(q) ||
        (row.enumerator_name ?? "").toLowerCase().includes(q) ||
        (row.enumerator_email ?? "").toLowerCase().includes(q) ||
        (draft?.enumerator_name ?? "").toLowerCase().includes(q) ||
        (draft?.enumerator_email ?? "").toLowerCase().includes(q) ||
        row.status.includes(q)
      );
    });
  }, [codes, drafts, search]);

  useEffect(() => {
    setCodesPage(1);
  }, [search]);

  const paginatedCodes = useMemo(
    () => paginate(filteredCodes, codesPage, PAGE_SIZE),
    [filteredCodes, codesPage],
  );

  const usedCodesCount = useMemo(
    () => codes.filter((row) => row.status === "used").length,
    [codes],
  );

  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/codes", {
        headers: { "x-admin-password": password },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid admin password.");
      }
      sessionStorage.setItem(ADMIN_STORAGE_KEY, password);
      setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unlock failed.");
    } finally {
      setLoading(false);
    }
  }

  function updateDraft(code: string, field: keyof AssigneeDraft, value: string) {
    setDrafts((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: field === "enumerator_name" ? value.toUpperCase() : value,
      },
    }));
  }

  async function handleSaveAssignment(row: AccessCodeRow) {
    const draft = drafts[row.code];
    if (!draft) return;

    setMessage("");
    setError("");
    setSavingCode(row.code);
    try {
      const res = await adminFetch("/api/admin/codes", {
        method: "PATCH",
        body: JSON.stringify({
          action: "assign",
          code: row.code,
          enumerator_name: draft.enumerator_name,
          enumerator_email: draft.enumerator_email,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save assignment.");
      }
      setMessage(`Saved assignee for ${row.code}.`);
      await refreshAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSavingCode(null);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setGeneratedCodes([]);
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/codes", {
        method: "POST",
        body: JSON.stringify({ action: "generate", count: generateCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate codes.");
      }
      setGeneratedCodes(data.codes || []);
      setMessage(`Generated ${data.codes?.length ?? 0} code(s). Assign enumerators in the list below.`);
      await refreshAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCode(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await adminFetch("/api/admin/codes", {
        method: "POST",
        body: JSON.stringify({
          action: "add",
          code: customCode,
          enumerator_name: addName,
          enumerator_email: addEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add code.");
      }
      setCustomCode("");
      setAddName("");
      setAddEmail("");
      setMessage(`Added code ${data.code}.`);
      await refreshAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject(code: string) {
    if (!confirm(`Reject code ${code}? Users will no longer be able to sign in with it.`)) {
      return;
    }
    setMessage("");
    setError("");
    try {
      const res = await adminFetch("/api/admin/codes", {
        method: "PATCH",
        body: JSON.stringify({ action: "reject", code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reject code.");
      }
      setMessage(`Rejected ${code}.`);
      await refreshAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed.");
    }
  }

  async function handleReactivate(code: string) {
    setMessage("");
    setError("");
    try {
      const res = await adminFetch("/api/admin/codes", {
        method: "PATCH",
        body: JSON.stringify({ action: "reactivate", code }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reactivate code.");
      }
      setMessage(`Reactivated ${code}.`);
      await refreshAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reactivate failed.");
    }
  }

  function copyCodes(list: string[]) {
    void navigator.clipboard.writeText(list.join("\n"));
    setMessage("Copied to clipboard.");
  }

  function handleExportUsedCodes() {
    setMessage("");
    setError("");

    const usedCodes = codes.filter((row) => row.status === "used");
    if (usedCodes.length === 0) {
      setMessage("No used codes to export.");
      return;
    }

    const date = new Date().toISOString().slice(0, 10);
    exportAccessCodesToExcel(usedCodes, `FACED_used_codes_${date}.xlsx`);
    setMessage(`Exported ${usedCodes.length} used code(s) to Excel.`);
  }

  if (!unlocked) {
    return (
      <div className={cn(ui.pageBg, "flex flex-col")}>
        <div className={cn(ui.appHeader, "py-5 text-center")}>
          <BrandEmblem size={72} className="mx-auto mb-2" />
          <p className={cn(ui.kicker, "text-xs font-bold uppercase")}>Administration</p>
          <h1 className="text-xl font-bold text-white">Access Code Management</h1>
          <TricolorBar thick className="mx-auto mt-4 max-w-xs" />
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className={cn(ui.loginCard, "w-full max-w-md")}>
            <div className={cn(ui.sectionHeader, "justify-center")}>Admin access</div>
            <div className={cn(ui.sectionBody, "space-y-4 rounded-b-xl border-b border-faced-blue-border")}>
              <p className="text-sm text-zinc-600">
                Enter the admin password to generate and manage enumerator access codes.
              </p>
              <form onSubmit={(e) => void handleUnlock(e)} className="space-y-3">
                <label className="block">
                  <span className={ui.label}>Admin password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={ui.input}
                    autoFocus
                    required
                  />
                </label>
                {error && <p className={ui.alertError}>{error}</p>}
                <button type="submit" className={cn(ui.btnPrimary, "w-full", ui.withIcon)} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Lock className={ui.iconSm} aria-hidden />
                      Unlock admin
                    </>
                  )}
                </button>
              </form>
              <p className="text-center text-xs text-zinc-500">
                <Link href="/" className={ui.link}>
                  Back to FACED app
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={ui.pageBg}>
      <header className={ui.appHeader}>
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BrandEmblem size={52} className="hidden shrink-0 sm:block" />
            <div>
              <p className={cn(ui.kicker, "text-xs font-bold uppercase")}>DSWD · Offline DMS</p>
              <h1 className="text-xl font-bold text-white">Access code admin</h1>
              <p className={cn(ui.subtitle, "text-sm")}>
                Generate codes and assign each one to an enumerator.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard" className={cn(ui.headerBtn, ui.withIcon)}>
              <LayoutDashboard className={ui.iconSm} aria-hidden />
              Dashboard
            </Link>
            <Link href="/records" className={cn(ui.headerBtn, ui.withIcon)}>
              <FolderOpen className={ui.iconSm} aria-hidden />
              Records
            </Link>
          </div>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {(message || error) && (
          <div className={error ? ui.alertError : ui.alertSuccess}>
            {error || message}
          </div>
        )}

        <div className={ui.verifyTabs} role="tablist" aria-label="Admin sections">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-label={tab.label}
                className={cn(ui.verifyTabClass(activeTab === tab.id), ui.withIcon)}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className={ui.iconSm} aria-hidden />
                <span className="sm:hidden">{tab.mobileLabel ?? tab.label}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === "create" ? (
        <>
        <section className={ui.card}>
          <div className={ui.sectionHeader}>Generate codes</div>
          <div className={ui.sectionBody}>
            <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className={ui.label}>How many codes?</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className={cn(ui.input, "w-28")}
                />
              </label>
              <button type="submit" disabled={loading} className={cn(ui.btnPrimary, ui.withIcon)}>
                <Sparkles className={ui.iconSm} aria-hidden />
                Generate
              </button>
            </form>
            {generatedCodes.length > 0 && (
              <div className="mt-4 rounded-lg border border-ph-yellow bg-ph-yellow-light p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-ph-blue-dark">
                    New codes — assign enumerators below
                  </p>
                  <button
                    type="button"
                    onClick={() => copyCodes(generatedCodes)}
                    className={cn(ui.link, "text-xs", ui.withIcon)}
                  >
                    <Copy className={ui.iconSm} aria-hidden />
                    Copy all
                  </button>
                </div>
                <ul className="space-y-1 font-mono text-sm">
                  {generatedCodes.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        <section className={ui.card}>
          <div className={ui.sectionHeader}>Add custom code</div>
          <div className={ui.sectionBody}>
            <form onSubmit={handleAddCode} className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className={ui.label}>Code</span>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="FACED-XXXX-XXXX"
                  className={cn(ui.input, "font-mono")}
                  required
                />
              </label>
              <label className="block">
                <span className={ui.label}>Enumerator name</span>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value.toUpperCase())}
                  placeholder="Full name"
                  className={ui.input}
                />
              </label>
              <label className="block">
                <span className={ui.label}>Enumerator email</span>
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="email@example.com"
                  className={ui.input}
                />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" disabled={loading} className={cn(ui.btnPrimary, ui.withIcon)}>
                  <Plus className={ui.iconSm} aria-hidden />
                  Add code
                </button>
              </div>
            </form>
          </div>
        </section>
        </>
        ) : null}

        {activeTab === "codes" ? (
        <section className={ui.card}>
          <div className={cn(ui.sectionHeader, "flex flex-wrap items-center justify-between gap-2")}>
            <span>All codes ({filteredCodes.length}{search ? ` of ${codes.length}` : ""})</span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportUsedCodes}
                disabled={loading || usedCodesCount === 0}
                className={cn(
                  "text-xs font-normal normal-case tracking-normal underline disabled:cursor-not-allowed disabled:opacity-50",
                  ui.withIcon,
                )}
              >
                <Download className={ui.iconSm} aria-hidden />
                Export used codes ({usedCodesCount})
              </button>
              <button
                type="button"
                onClick={() => void refreshAdminData()}
                disabled={loading}
                className={cn("text-xs font-normal normal-case tracking-normal underline", ui.withIcon)}
              >
                <RefreshCw className={cn(ui.iconSm, loading && "animate-spin")} aria-hidden />
                Refresh
              </button>
            </div>
          </div>
          <div className="border-b border-faced-blue-border bg-ph-blue-light/50 px-4 py-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, name, email, or status..."
              className={ui.input}
            />
          </div>

          {/* Desktop table */}
          <div className={cn(ui.sectionBody, "hidden overflow-x-auto p-0 lg:block")}>
            <table className={cn(ui.table, "w-full min-w-[960px] text-sm")}>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Enumerator</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Used at</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && codes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <SkeletonScreen label="Loading access codes">
                        <SkeletonTable rows={6} columns={6} />
                      </SkeletonScreen>
                    </td>
                  </tr>
                ) : filteredCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-zinc-500">
                      {codes.length === 0
                        ? "No access codes yet. Generate or add one above."
                        : "No codes match your search."}
                    </td>
                  </tr>
                ) : (
                  paginatedCodes.map((row) => {
                    const draft = drafts[row.code] ?? {
                      enumerator_name: "",
                      enumerator_email: "",
                    };
                    const changed = draftChanged(row, draft);
                    return (
                      <tr key={row.code}>
                        <td className="font-mono text-xs">{row.code}</td>
                        <td>
                          <input
                            type="text"
                            value={draft.enumerator_name}
                            onChange={(e) =>
                              updateDraft(row.code, "enumerator_name", e.target.value)
                            }
                            placeholder="Assign name"
                            className={cn(ui.input, "min-w-[140px] text-xs")}
                          />
                        </td>
                        <td>
                          <input
                            type="email"
                            value={draft.enumerator_email}
                            onChange={(e) =>
                              updateDraft(row.code, "enumerator_email", e.target.value)
                            }
                            placeholder="Assign email"
                            className={cn(ui.input, "min-w-[160px] text-xs")}
                          />
                        </td>
                        <td>
                          <span
                            className={cn(
                              "inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase",
                              row.status === "active"
                                ? ui.badgeSynced
                                : row.status === "used"
                                  ? ui.badgePending
                                  : ui.badgeFailed,
                            )}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td className="text-xs text-zinc-600">{formatDate(row.used_at)}</td>
                        <td className="whitespace-nowrap">
                          {changed && (
                            <button
                              type="button"
                              onClick={() => void handleSaveAssignment(row)}
                              disabled={savingCode === row.code}
                              className={cn(ui.link, "mr-2 text-xs", ui.withIcon)}
                            >
                              {savingCode === row.code ? (
                                <>
                                  <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Save className={ui.iconSm} aria-hidden />
                                  Save
                                </>
                              )}
                            </button>
                          )}
                          {row.status !== "rejected" ? (
                            <button
                              type="button"
                              onClick={() => void handleReject(row.code)}
                              className={cn("text-xs font-bold text-ph-red hover:underline", ui.withIcon)}
                            >
                              <Ban className={ui.iconSm} aria-hidden />
                              Reject
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleReactivate(row.code)}
                              className={cn(ui.link, "text-xs", ui.withIcon)}
                            >
                              <RotateCcw className={ui.iconSm} aria-hidden />
                              Reactivate
                            </button>
                          )}
                          {row.status === "used" && (
                            <button
                              type="button"
                              onClick={() => void handleReactivate(row.code)}
                              className={cn(ui.link, "ml-2 text-xs", ui.withIcon)}
                            >
                              <RotateCcw className={ui.iconSm} aria-hidden />
                              Reset
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            <AdminPagination
              page={codesPage}
              totalItems={filteredCodes.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCodesPage}
            />
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 p-4 lg:hidden">
            {loading && codes.length === 0 ? (
              <SkeletonScreen label="Loading access codes">
                <SkeletonTable rows={5} columns={4} />
              </SkeletonScreen>
            ) : filteredCodes.length === 0 ? (
              <p className="text-center text-sm text-zinc-500">
                {codes.length === 0
                  ? "No access codes yet."
                  : "No codes match your search."}
              </p>
            ) : (
              paginatedCodes.map((row) => {
                const draft = drafts[row.code] ?? {
                  enumerator_name: "",
                  enumerator_email: "",
                };
                const changed = draftChanged(row, draft);
                return (
                  <article key={row.code} className={ui.adminCodeCard}>
                    <div className={ui.adminCodeCardHeader}>
                      <span className="font-mono text-sm font-bold text-ph-blue-dark">
                        {row.code}
                      </span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-bold uppercase",
                          row.status === "active"
                            ? ui.badgeSynced
                            : row.status === "used"
                              ? ui.badgePending
                              : ui.badgeFailed,
                        )}
                      >
                        {row.status}
                      </span>
                    </div>
                    <div className="space-y-2 p-3">
                      <label className="block">
                        <span className={ui.label}>Enumerator name</span>
                        <input
                          type="text"
                          value={draft.enumerator_name}
                          onChange={(e) =>
                            updateDraft(row.code, "enumerator_name", e.target.value)
                          }
                          placeholder="Full name"
                          className={cn(ui.input, "text-sm")}
                        />
                      </label>
                      <label className="block">
                        <span className={ui.label}>Email</span>
                        <input
                          type="email"
                          value={draft.enumerator_email}
                          onChange={(e) =>
                            updateDraft(row.code, "enumerator_email", e.target.value)
                          }
                          placeholder="email@example.com"
                          className={cn(ui.input, "text-sm")}
                        />
                      </label>
                      <p className="text-xs text-zinc-500">Used: {formatDate(row.used_at)}</p>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {changed && (
                          <button
                            type="button"
                            onClick={() => void handleSaveAssignment(row)}
                            disabled={savingCode === row.code}
                            className={cn(ui.btnPrimary, "text-xs", ui.withIcon)}
                          >
                            {savingCode === row.code ? (
                              <>
                                <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className={ui.iconSm} aria-hidden />
                                Save assignee
                              </>
                            )}
                          </button>
                        )}
                        {row.status !== "rejected" ? (
                          <button
                            type="button"
                            onClick={() => void handleReject(row.code)}
                            className={cn(ui.btnDanger, "text-xs", ui.withIcon)}
                          >
                            <Ban className={ui.iconSm} aria-hidden />
                            Reject
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleReactivate(row.code)}
                            className={cn(ui.btnSecondary, "text-xs", ui.withIcon)}
                          >
                            <RotateCcw className={ui.iconSm} aria-hidden />
                            Reactivate
                          </button>
                        )}
                        {row.status === "used" && (
                          <button
                            type="button"
                            onClick={() => void handleReactivate(row.code)}
                            className={cn(ui.btnSecondary, "text-xs", ui.withIcon)}
                          >
                            <RotateCcw className={ui.iconSm} aria-hidden />
                            Reset
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
            <AdminPagination
              page={codesPage}
              totalItems={filteredCodes.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCodesPage}
            />
          </div>
        </section>
        ) : null}

        {activeTab === "ec-library" ? (
          <EcLibraryPanel
            adminFetch={adminFetch}
            onMessage={setMessage}
            onError={setError}
          />
        ) : null}
      </main>
    </div>
  );
}
