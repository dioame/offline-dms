"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Download, Loader2, WifiOff, X } from "lucide-react";
import { getAuthSession } from "@/lib/db";
import {
  downloadEncodeOfflineBundle,
  type EncodeOfflineDownloadProgress,
} from "@/lib/encode-offline-download";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type EncodeOfflineDownloadModalProps = {
  minimized?: boolean;
  onHide?: () => void;
  onComplete: () => void;
};

async function serverSupportsOfflineBundle(): Promise<boolean> {
  try {
    const res = await fetch("/api/health");
    const data = (await res.json()) as { ok?: boolean; turso?: string };
    return Boolean(res.ok && data.ok && data.turso === "connected");
  } catch {
    return false;
  }
}

function ProgressBlock({
  progress,
  downloading,
}: {
  progress: EncodeOfflineDownloadProgress | null;
  downloading: boolean;
}) {
  if (!progress) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-slate-800">{progress.label}</span>
        <span className="shrink-0 tabular-nums text-slate-500">
          {progress.total > 0
            ? `${progress.downloaded} / ${progress.total}`
            : `${Math.round(progress.percent)}%`}
        </span>
      </div>
      <div className={ui.verifyProgress}>
        <div
          className={ui.verifyProgressBar}
          style={{
            width: `${Math.min(100, Math.max(progress.percent, downloading ? 8 : 0))}%`,
          }}
        />
      </div>
    </div>
  );
}

export default function EncodeOfflineDownloadModal({
  minimized = true,
  onHide,
  onComplete,
}: EncodeOfflineDownloadModalProps) {
  const [progress, setProgress] = useState<EncodeOfflineDownloadProgress | null>(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [skipped, setSkipped] = useState(false);

  const startDownload = useCallback(async () => {
    setError("");
    setDownloading(true);
    setProgress({
      phase: "families",
      label: "Preparing download",
      downloaded: 0,
      total: 0,
      percent: 0,
    });

    try {
      const session = await getAuthSession();
      if (!session?.code || !session.sessionId) {
        throw new Error("Encoder session expired. Sign in again.");
      }

      const headers = {
        "x-encode-code": session.code,
        "x-encode-session-id": session.sessionId,
      };

      const result = await downloadEncodeOfflineBundle(
        (offset, limit) =>
          fetch(`/api/encode/offline-sync?offset=${offset}&limit=${limit}`, { headers }),
        () => fetch("/api/encode/ec-library", { headers }),
        setProgress,
      );

      setProgress({
        phase: "finishing",
        label: `Ready — ${result.totalFamilies} families, ${result.totalEcSites} EC sites`,
        downloaded: result.totalFamilies + result.totalEcSites,
        total: result.totalFamilies + result.totalEcSites,
        percent: 100,
      });

      window.setTimeout(() => {
        onComplete();
      }, 400);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed.");
      setDownloading(false);
    }
  }, [onComplete]);

  useEffect(() => {
    void (async () => {
      const supported = await serverSupportsOfflineBundle();
      if (!supported) {
        setSkipped(true);
        onComplete();
        return;
      }
      void startDownload();
    })();
  }, [onComplete, startDownload]);

  if (skipped) {
    return null;
  }

  if (minimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-[80] w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-faced-blue-border bg-white shadow-lg"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center justify-between gap-2 bg-ph-blue px-3 py-2 text-xs font-bold text-white">
          <span className="truncate">Downloading offline copy</span>
          {downloading && !error ? (
            <Loader2 className={cn(ui.iconSm, "shrink-0 animate-spin")} aria-hidden />
          ) : null}
        </div>
        <div className="space-y-2 p-3">
          <ProgressBlock progress={progress} downloading={downloading} />
          {error ? <p className="text-xs text-red-700">{error}</p> : null}
          {error ? (
            <button
              type="button"
              onClick={() => void startDownload()}
              disabled={downloading}
              className={cn(ui.btnPrimary, "w-full text-xs", ui.withIcon)}
            >
              <Download className={ui.iconSm} aria-hidden />
              Retry
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(ui.modalBackdrop, "z-[80]")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="encode-offline-download-title"
    >
      <div className="w-full max-w-sm overflow-hidden rounded-xl border border-faced-blue-border bg-white shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, "flex items-center justify-between gap-2 py-2.5")}>
          <h2 id="encode-offline-download-title" className="text-sm">
            Download offline copy
          </h2>
          {onHide ? (
            <button
              type="button"
              onClick={onHide}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold",
                "text-white/90 hover:bg-white/15",
                ui.withIcon,
              )}
            >
              <ChevronDown className={ui.iconSm} aria-hidden />
              Hide
            </button>
          ) : null}
        </div>
        <div className="space-y-3 p-3">
          <p className="text-xs leading-relaxed text-slate-600">
            Downloading family records and evacuation centers for offline encoding. Stay online
            until finished.
          </p>

          <ProgressBlock progress={progress} downloading={downloading} />

          {error ? <div className={cn(ui.alertError, "text-xs")}>{error}</div> : null}

          {!navigator.onLine && !error ? (
            <p className={cn(ui.alertWarning, ui.withIcon, "text-xs")}>
              <WifiOff className={ui.iconSm} aria-hidden />
              Connect to the internet to download.
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-faced-blue-border pt-2">
            {error ? (
              <button
                type="button"
                onClick={() => void startDownload()}
                disabled={downloading}
                className={cn(ui.btnPrimary, "text-xs", ui.withIcon)}
              >
                {downloading ? (
                  <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                ) : (
                  <Download className={ui.iconSm} aria-hidden />
                )}
                Retry
              </button>
            ) : (
              <p className={cn(ui.withIcon, "text-xs text-slate-500")}>
                <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                Downloading…
              </p>
            )}
            {onHide ? (
              <button
                type="button"
                onClick={onHide}
                className={cn(ui.btnSecondary, "text-xs", ui.withIcon)}
              >
                <X className={ui.iconSm} aria-hidden />
                Hide
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
