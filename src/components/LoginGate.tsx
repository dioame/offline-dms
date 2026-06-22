"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getStoredSession,
  loginWithCode,
  logout,
  validateStoredSessionOnline,
} from "@/lib/auth-client";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";

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
      <div className="ph-page-bg flex min-h-full items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <BrandEmblem size={48} className="animate-pulse opacity-80" />
          <p className="text-sm font-medium text-[var(--ph-blue)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="ph-page-bg flex min-h-full flex-col">
        <div className="ph-app-header py-5 text-center">
          <BrandEmblem size={80} className="mx-auto mb-3" />
          <p className="ph-kicker text-xs font-bold uppercase">DSWD · Offline DMS</p>
          <h1 className="mt-1 text-xl font-bold text-white">Family Assistance Card (FACED)</h1>
          <TricolorBar thick className="mx-auto mt-4 max-w-xs" />
        </div>

        <div className="flex flex-1 items-center justify-center p-4">
          <div className="ph-login-card ph-card w-full max-w-md">
            <div className="faced-section-header justify-center">Access required</div>
            <div className="faced-section-body space-y-4 rounded-b-xl border-b border-[var(--faced-blue-border)]">
              <p className="text-center text-sm text-zinc-600">
                Enter the access code from your administrator. Each code works on{" "}
                <strong className="text-[var(--ph-blue)]">one device only</strong>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block">
                  <span className="faced-label">Access code</span>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="FACED-XXXX-XXXX"
                    className="faced-input font-mono tracking-widest"
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </label>

                {!isOnline && (
                  <p className="ph-alert-warning">
                    You are offline. Connect to the internet to sign in with a new access
                    code.
                  </p>
                )}

                {error && <p className="ph-alert-error">{error}</p>}

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
                <Link href="/admin" className="ph-link">
                  Manage access codes
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="ph-session-bar">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2 text-xs">
          <span className="text-zinc-700">
            Signed in ·{" "}
            <span className="font-mono font-bold text-[var(--ph-blue)]">{sessionCode}</span>
          </span>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="font-semibold text-[var(--ph-red)] hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
      {children}
    </>
  );
}
