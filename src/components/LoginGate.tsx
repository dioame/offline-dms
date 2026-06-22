"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  getStoredSession,
  loginWithCode,
  logout,
  validateStoredSessionOnline,
} from "@/lib/auth-client";

type LoginGateProps = {
  children: React.ReactNode;
};

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getOnlineServerSnapshot() {
  return true;
}

export default function LoginGate({ children }: LoginGateProps) {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot,
  );

  const checkSession = useCallback(async () => {
    const session = await getStoredSession();
    if (!session) {
      setAuthenticated(false);
      setSessionCode(null);
      setReady(true);
      return;
    }

    const valid = await validateStoredSessionOnline();
    setAuthenticated(valid);
    setSessionCode(valid ? session.code : null);
    setReady(true);
  }, []);

  useEffect(() => {
    void checkSession();
  }, [checkSession]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await loginWithCode(code);
      setAuthenticated(true);
      setSessionCode(code.trim().toUpperCase());
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    setAuthenticated(false);
    setSessionCode(null);
    setCode("");
    setError("");
  }

  if (!ready) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-100 p-6">
        <p className="text-sm text-zinc-600">Loading...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-full items-center justify-center bg-zinc-100 p-4">
        <div className="w-full max-w-md overflow-hidden rounded-xl border border-[var(--faced-blue-border)] bg-white shadow-sm">
          <div className="faced-section-header text-center">Access required</div>
          <div className="faced-section-body space-y-4">
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--faced-blue)]">
                DSWD · Offline DMS
              </p>
              <h1 className="mt-1 text-lg font-bold text-zinc-900">
                Family Assistance Card (FACED)
              </h1>
              <p className="mt-2 text-sm text-zinc-600">
                Enter the access code provided by your administrator. Each code
                works on one device only and cannot be reused after sign-in.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block">
                <span className="faced-label">Access code</span>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="FACED-XXXX-XXXX"
                  className="faced-input font-mono tracking-wider"
                  autoComplete="off"
                  autoFocus
                  required
                />
              </label>

              {!isOnline && (
                <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  You are offline. Connect to the internet to sign in with a new
                  access code.
                </p>
              )}

              {error && (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !isOnline}
                className="faced-btn-primary w-full disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Continue to FACED form"}
              </button>
            </form>

            <p className="text-center text-xs text-zinc-500">
              Administrator?{" "}
              <a
                href="/admin"
                className="font-medium text-[var(--faced-blue)] hover:underline"
              >
                Manage access codes
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border-b border-[var(--faced-blue-border)] bg-[var(--faced-blue-light)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2 text-xs">
          <span className="text-zinc-700">
            Signed in with code{" "}
            <span className="font-mono font-semibold text-[var(--faced-blue)]">
              {sessionCode}
            </span>
          </span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="font-medium text-[var(--faced-blue)] hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
