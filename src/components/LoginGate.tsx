"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  getStoredSession,
  loginWithCode,
  validateStoredSessionOnline,
} from "@/lib/auth-client";
import { needsEncodeOfflineDownload } from "@/lib/ec-library-cache";
import EncodeOfflineDownloadModal from "@/components/encode/EncodeOfflineDownloadModal";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import {
  ArrowRight,
  KeyRound,
  Loader2,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";
import { SkeletonEmblemLoader, SkeletonScreen } from "@/components/ui/Skeleton";

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
  const [bundleChecked, setBundleChecked] = useState(false);
  const [needsBundle, setNeedsBundle] = useState(false);
  const [bundleReady, setBundleReady] = useState(false);
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

  useEffect(() => {
    if (!authenticated) {
      setBundleChecked(false);
      setNeedsBundle(false);
      setBundleReady(false);
      return;
    }

    let cancelled = false;
    void needsEncodeOfflineDownload().then((needs) => {
      if (cancelled) return;
      setNeedsBundle(needs);
      if (!needs) {
        setBundleReady(true);
      }
      setBundleChecked(true);
    });

    return () => {
      cancelled = true;
    };
  }, [authenticated]);

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

  if (!ready) {
    return (
      <div className={cn(ui.pageBg, "flex items-center justify-center p-6")}>
        <SkeletonScreen label="Loading session">
          <SkeletonEmblemLoader />
        </SkeletonScreen>
      </div>
    );
  }

  if (authenticated && !bundleChecked) {
    return (
      <div className={cn(ui.pageBg, "flex items-center justify-center p-6")}>
        <SkeletonScreen label="Preparing offline data">
          <SkeletonEmblemLoader />
        </SkeletonScreen>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={cn(ui.pageBg, "flex flex-col")}>
        <div className={cn(ui.appHeader, "py-5 text-center")}>
          <BrandEmblem size={80} className="mx-auto mb-3" />
          <p className={cn(ui.kicker, "text-xs font-bold uppercase")}>DSWD · Offline DMS</p>
          <h1 className="mt-1 text-xl font-bold text-white">Family Assistance Card (FACED)</h1>
          <TricolorBar thick className="mx-auto mt-4 max-w-xs" />
        </div>

        <div className="flex flex-1 items-center justify-center p-4">
          <div className={cn(ui.loginCard, "w-full max-w-md")}>
            <div className={cn(ui.sectionHeader, "justify-center")}>Access required</div>
            <div className={cn(ui.sectionBody, "space-y-4 rounded-b-xl border-b border-faced-blue-border")}>
              <p className="text-center text-sm text-zinc-600">
                Enter the access code from your administrator. Each code works on{" "}
                <strong className="text-ph-blue">one device only</strong>.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block">
                  <span className={cn(ui.label, ui.withIcon)}>
                    <KeyRound className={ui.iconSm} aria-hidden />
                    Access code
                  </span>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="FACED-XXXX-XXXX"
                    className={cn(ui.input, "font-mono tracking-widest")}
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </label>

                {!isOnline && (
                  <p className={cn(ui.alertWarning, ui.withIcon)}>
                    <WifiOff className={ui.iconMd} aria-hidden />
                    You are offline. Connect to the internet to sign in with a new access
                    code.
                  </p>
                )}

                {error && <p className={ui.alertError}>{error}</p>}

                <button
                  type="submit"
                  disabled={loading || !isOnline}
                  className={cn(ui.btnPrimary, ui.withIcon, "w-full disabled:opacity-50")}
                >
                  {loading ? (
                    <>
                      <Loader2 className={cn(ui.iconMd, "animate-spin")} aria-hidden />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue to FACED form
                      <ArrowRight className={ui.iconMd} aria-hidden />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-xs text-zinc-500">
                Administrator?{" "}
                <Link href="/admin" className={ui.link}>
                  Manage access codes
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authenticated && needsBundle && isOnline && !bundleReady) {
    return (
      <>
        <div className={ui.sessionBar}>
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2 text-xs">
            <span className={cn(ui.withIcon, "text-zinc-700")}>
              <ShieldCheck className={ui.iconSm} aria-hidden />
              Signed in ·{" "}
              <span className="font-mono font-bold text-ph-blue">{sessionCode}</span>
            </span>
          </div>
        </div>
        {children}
        <EncodeOfflineDownloadModal onComplete={() => setBundleReady(true)} />
      </>
    );
  }

  return (
    <>
      <div className={ui.sessionBar}>
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2 text-xs">
          <span className={cn(ui.withIcon, "text-zinc-700")}>
            <ShieldCheck className={ui.iconSm} aria-hidden />
            Signed in ·{" "}
            <span className="font-mono font-bold text-ph-blue">{sessionCode}</span>
          </span>
        </div>
      </div>
      {children}
    </>
  );
}
