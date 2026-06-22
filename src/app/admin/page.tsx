"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
      <div className="flex min-h-full items-center justify-center bg-zinc-100 p-4">
        <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--faced-blue-border)] bg-white shadow-sm">
          <div className="faced-section-header text-center">Admin access</div>
          <div className="faced-section-body space-y-4">
            <p className="text-sm text-zinc-600">
              Enter the admin password to generate and manage enumerator access
              codes.
            </p>
            <form onSubmit={handleUnlock} className="space-y-3">
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
              {error && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}
              <button type="submit" className="faced-btn-primary w-full">
                Unlock admin
              </button>
            </form>
            <p className="text-center text-xs text-zinc-500">
              <Link href="/" className="text-[var(--faced-blue)] hover:underline">
                Back to FACED app
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-zinc-100">
      <header className="border-b border-[var(--faced-blue-border)] bg-white">
        <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--faced-blue)]">
              DSWD · Offline DMS
            </p>
            <h1 className="text-xl font-bold text-zinc-900">Access code admin</h1>
            <p className="text-sm text-zinc-600">
              Generate, add, and reject login codes for field enumerators.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="faced-btn-secondary">
              FACED app
            </Link>
            <button type="button" onClick={handleLock} className="faced-btn-secondary">
              Lock admin
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        {(message || error) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-green-200 bg-green-50 text-green-800"
            }`}
          >
            {error || message}
          </div>
        )}

        <section className="overflow-hidden rounded-xl border border-[var(--faced-blue-border)] bg-white shadow-sm">
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
              <div className="mt-4 rounded border border-[var(--faced-blue-border)] bg-[var(--faced-blue-light)] p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-[var(--faced-blue)]">
                    New codes — share with enumerators
                  </p>
                  <button
                    type="button"
                    onClick={() => copyCodes(generatedCodes)}
                    className="text-xs font-medium text-[var(--faced-blue)] hover:underline"
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

        <section className="overflow-hidden rounded-xl border border-[var(--faced-blue-border)] bg-white shadow-sm">
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

        <section className="overflow-hidden rounded-xl border border-[var(--faced-blue-border)] bg-white shadow-sm">
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
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.status === "active"
                              ? "bg-green-100 text-green-800"
                              : row.status === "used"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-red-100 text-red-800"
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
                            className="text-xs font-medium text-red-700 hover:underline"
                          >
                            Reject
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void handleReactivate(row.code)}
                            className="text-xs font-medium text-[var(--faced-blue)] hover:underline"
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
