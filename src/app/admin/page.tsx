"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";

type AccessCodeRow = {
  code: string;
  status: "active" | "used" | "rejected";
  created_at: string;
  rejected_at: string | null;
  used_at: string | null;
  session_id: string | null;
  last_used_at: string | null;
};

const ADMIN_STORAGE_KEY = "dms_admin_password";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [codes, setCodes] = useState<AccessCodeRow[]>([]);
  const [generateCount, setGenerateCount] = useState(5);
  const [customCode, setCustomCode] = useState("");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      setCodes(data.codes || []);
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

  useEffect(() => {
    if (unlocked) {
      void loadCodes();
    }
  }, [unlocked, loadCodes]);

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

  function handleLock() {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    setUnlocked(false);
    setCodes([]);
    setGeneratedCodes([]);
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
      setMessage(`Generated ${data.codes?.length ?? 0} code(s).`);
      await loadCodes();
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
        body: JSON.stringify({ action: "add", code: customCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to add code.");
      }
      setCustomCode("");
      setMessage(`Added code ${data.code}.`);
      await loadCodes();
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
      await loadCodes();
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
      await loadCodes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reactivate failed.");
    }
  }

  function copyCodes(list: string[]) {
    void navigator.clipboard.writeText(list.join("\n"));
    setMessage("Copied to clipboard.");
  }

  if (!unlocked) {
    return (
      <div className="ph-page-bg flex min-h-full flex-col">
        <div className="ph-app-header py-5 text-center">
          <BrandEmblem size={72} className="mx-auto mb-2" />
          <p className="ph-kicker text-xs font-bold uppercase">Administration</p>
          <h1 className="text-xl font-bold text-white">Access Code Management</h1>
          <TricolorBar thick className="mx-auto mt-4 max-w-xs" />
        </div>
        <div className="flex flex-1 items-center justify-center p-4">
          <div className="ph-login-card ph-card w-full max-w-md">
            <div className="faced-section-header justify-center">Admin access</div>
            <div className="faced-section-body space-y-4 rounded-b-xl border-b border-[var(--faced-blue-border)]">
              <p className="text-sm text-zinc-600">
                Enter the admin password to generate and manage enumerator access codes.
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
                  {loading ? "Verifying..." : "Unlock admin"}
                </button>
              </form>
              <p className="text-center text-xs text-zinc-500">
                <Link href="/" className="ph-link">
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
    <div className="ph-page-bg min-h-full">
      <header className="ph-app-header">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <BrandEmblem size={52} className="hidden shrink-0 sm:block" />
            <div>
              <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
              <h1 className="text-xl font-bold text-white">Access code admin</h1>
              <p className="ph-subtitle text-sm">
                Generate, add, and reject login codes for field enumerators.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="faced-btn-secondary !border-white/40 !text-white hover:!bg-white/10">
              FACED app
            </Link>
            <button type="button" onClick={handleLock} className="faced-btn-danger !border-white/40 !text-white hover:!bg-white/10">
              Lock admin
            </button>
          </div>
        </div>
        <TricolorBar thick />
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {(message || error) && (
          <div className={error ? "ph-alert-error" : "ph-alert-success"}>
            {error || message}
          </div>
        )}

        <section className="ph-card">
          <div className="faced-section-header">Generate codes</div>
          <div className="faced-section-body">
            <form onSubmit={handleGenerate} className="flex flex-wrap items-end gap-3">
              <label className="block">
                <span className="faced-label">How many codes?</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="faced-input w-28"
                />
              </label>
              <button type="submit" disabled={loading} className="faced-btn-primary">
                Generate
              </button>
            </form>
            {generatedCodes.length > 0 && (
              <div className="mt-4 rounded-lg border border-[var(--ph-yellow)] bg-[var(--ph-yellow-light)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-[var(--ph-blue-dark)]">
                    New codes — share with enumerators
                  </p>
                  <button
                    type="button"
                    onClick={() => copyCodes(generatedCodes)}
                    className="ph-link text-xs"
                  >
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

        <section className="ph-card">
          <div className="faced-section-header">Add custom code</div>
          <div className="faced-section-body">
            <form onSubmit={handleAddCode} className="flex flex-wrap items-end gap-3">
              <label className="block min-w-[200px] flex-1">
                <span className="faced-label">Code</span>
                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  placeholder="FACED-XXXX-XXXX or custom"
                  className="faced-input font-mono"
                  required
                />
              </label>
              <button type="submit" disabled={loading} className="faced-btn-primary">
                Add code
              </button>
            </form>
          </div>
        </section>

        <section className="ph-card">
          <div className="faced-section-header flex items-center justify-between">
            <span>All codes ({codes.length})</span>
            <button
              type="button"
              onClick={() => void loadCodes()}
              disabled={loading}
              className="text-xs font-normal normal-case tracking-normal underline"
            >
              Refresh
            </button>
          </div>
          <div className="faced-section-body overflow-x-auto p-0">
            <table className="faced-table w-full min-w-[640px] text-sm">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Used at</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {codes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-zinc-500">
                      No access codes yet. Generate or add one above.
                    </td>
                  </tr>
                ) : (
                  codes.map((row) => (
                    <tr key={row.code}>
                      <td className="font-mono">{row.code}</td>
                      <td>
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${
                            row.status === "active"
                              ? "ph-badge-synced"
                              : row.status === "used"
                                ? "ph-badge-pending"
                                : "ph-badge-failed"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="text-xs text-zinc-600">{formatDate(row.created_at)}</td>
                      <td className="text-xs text-zinc-600">{formatDate(row.used_at)}</td>
                      <td>
                        {row.status !== "rejected" ? (
                          <button
                            type="button"
                            onClick={() => void handleReject(row.code)}
                            className="text-xs font-bold text-[var(--ph-red)] hover:underline"
                          >
                            Reject
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleReactivate(row.code)}
                            className="ph-link text-xs"
                          >
                            Reactivate
                          </button>
                        )}
                        {row.status === "used" && (
                          <button
                            type="button"
                            onClick={() => void handleReactivate(row.code)}
                            className="ml-2 text-xs font-medium text-[var(--faced-blue)] hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
