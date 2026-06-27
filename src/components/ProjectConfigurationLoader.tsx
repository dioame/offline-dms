"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, RefreshCw, Settings2, X } from "lucide-react";
import BrandEmblem from "@/components/brand/BrandEmblem";
import TricolorBar from "@/components/brand/TricolorBar";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type ReadinessStatus = "pending" | "ready" | "failed";

type ReadinessItem = {
  id: string;
  label: string;
  status: ReadinessStatus;
  message?: string;
};

type ProjectConfigurationLoaderProps = {
  children: React.ReactNode;
};

const CLIENT_CHECKS: Array<{
  id: string;
  label: string;
  run: () => { ready: boolean; message?: string };
}> = [
  {
    id: "api_server",
    label: "Application server reachable",
    run: () => ({ ready: true }),
  },
  {
    id: "indexed_db",
    label: "Offline record storage (IndexedDB)",
    run: () => ({
      ready: typeof indexedDB !== "undefined",
      message:
        typeof indexedDB !== "undefined"
          ? undefined
          : "IndexedDB is not available in this browser",
    }),
  },
  {
    id: "local_storage",
    label: "Browser local storage",
    run: () => {
      try {
        const key = "__offline_dms_probe__";
        localStorage.setItem(key, "1");
        localStorage.removeItem(key);
        return { ready: true };
      } catch {
        return { ready: false, message: "Local storage is blocked or unavailable" };
      }
    },
  },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchReadinessReport(): Promise<{
  ok: boolean;
  checks: Array<{ id: string; label: string; ready: boolean; message?: string }>;
  error?: string;
}> {
  const response = await fetch("/api/readiness", { cache: "no-store" });
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = (await response.text()).trim();
    const preview = text.replace(/\s+/g, " ").slice(0, 120);
    throw new Error(
      preview || `Server responded with HTTP ${response.status}`,
    );
  }

  return response.json() as Promise<{
    ok: boolean;
    checks: Array<{ id: string; label: string; ready: boolean; message?: string }>;
    error?: string;
  }>;
}

async function fetchReadinessWithRetry(maxAttempts = 8) {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fetchReadinessReport();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Readiness check failed");
      if (attempt < maxAttempts - 1) {
        await sleep(500);
      }
    }
  }

  throw lastError ?? new Error("Could not reach the application server");
}

function StatusIcon({ status }: { status: ReadinessStatus }) {
  if (status === "pending") {
    return (
      <Loader2
        className={cn(ui.iconMd, "animate-spin text-ph-blue")}
        aria-hidden
      />
    );
  }

  if (status === "ready") {
    return <Check className={cn(ui.iconMd, "text-emerald-600")} aria-hidden />;
  }

  return <X className={cn(ui.iconMd, "text-ph-red")} aria-hidden />;
}

export default function ProjectConfigurationLoader({
  children,
}: ProjectConfigurationLoaderProps) {
  const initialItems = useMemo<ReadinessItem[]>(
    () =>
      CLIENT_CHECKS.map((check) => ({
        id: check.id,
        label: check.label,
        status: "pending",
      })),
    [],
  );

  const [items, setItems] = useState<ReadinessItem[]>(initialItems);
  const [complete, setComplete] = useState(false);
  const [running, setRunning] = useState(true);

  const updateItem = useCallback(
    (id: string, patch: Partial<ReadinessItem>) => {
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const runChecks = useCallback(async () => {
    setRunning(true);
    setComplete(false);

    const serverPlaceholders: ReadinessItem[] = [
      { id: "database_configured", label: "Database URL configured", status: "pending" },
      { id: "database_file", label: "Database file accessible", status: "pending" },
      { id: "database_connected", label: "Database connection", status: "pending" },
      { id: "database_schema", label: "Database schema ready", status: "pending" },
      { id: "admin_password", label: "Admin password configured", status: "pending" },
      { id: "verify_password", label: "Verify password configured", status: "pending" },
    ];

    setItems([
      ...CLIENT_CHECKS.map((check) => ({
        id: check.id,
        label: check.label,
        status: "pending" as const,
      })),
      ...serverPlaceholders,
    ]);

    for (const check of CLIENT_CHECKS) {
      if (check.id === "api_server") continue;
      const result = check.run();
      updateItem(check.id, {
        status: result.ready ? "ready" : "failed",
        message: result.message,
      });
    }

    try {
      const data = await fetchReadinessWithRetry();

      updateItem("api_server", {
        status: "ready",
      });

      for (const check of data.checks) {
        if (check.id === "readiness_error") {
          updateItem("api_server", {
            status: "failed",
            message: check.message,
          });
          continue;
        }

        updateItem(check.id, {
          label: check.label,
          status: check.ready ? "ready" : "failed",
          message: check.message,
        });
      }

      const clientReady = CLIENT_CHECKS.filter(
        (check) => check.id !== "api_server",
      ).every((check) => check.run().ready);

      if (clientReady && data.ok) {
        setComplete(true);
      }
    } catch (error) {
      updateItem("api_server", {
        status: "failed",
        message:
          error instanceof Error ? error.message : "Could not reach the application server",
      });
    } finally {
      setRunning(false);
    }
  }, [updateItem]);

  useEffect(() => {
    void runChecks();
  }, [runChecks]);

  const allReady = items.length > 0 && items.every((item) => item.status === "ready");
  const hasFailures = items.some((item) => item.status === "failed");

  if (complete && allReady) {
    return <>{children}</>;
  }

  return (
    <div className={cn(ui.pageBg, "flex min-h-full flex-col")}>
      <div className={cn(ui.appHeader, "py-5 text-center")}>
        <BrandEmblem size={72} className="mx-auto mb-3" />
        <p className={cn(ui.kicker, "text-xs font-bold uppercase")}>DSWD · Offline DMS</p>
        <h1 className="mt-1 text-xl font-bold text-white">Loading project configuration</h1>
        <p className={cn(ui.subtitle, "mt-2 text-sm")}>
          Checking that requirements are ready before you continue.
        </p>
        <TricolorBar thick className="mx-auto mt-4 max-w-sm" />
      </div>

      <div className="flex flex-1 items-center justify-center p-4">
        <div className={cn(ui.loginCard, "w-full max-w-lg")}>
          <div className={cn(ui.sectionHeader, ui.withIcon)}>
            <Settings2 className={ui.iconSm} aria-hidden />
            System requirements
          </div>
          <div
            className={cn(
              ui.sectionBody,
              "space-y-3 rounded-b-xl border-b border-faced-blue-border",
            )}
          >
            <ul className="space-y-2" role="list">
              {items.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2.5",
                    item.status === "ready" && "border-emerald-200 bg-emerald-50/60",
                    item.status === "failed" && "border-red-200 bg-red-50/60",
                    item.status === "pending" && "border-faced-blue-border bg-white",
                  )}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={item.status === "ready"}
                    aria-label={item.label}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-ph-blue"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={item.status} />
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    </div>
                    {item.message ? (
                      <p className="mt-1 text-xs text-zinc-600">{item.message}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>

            {running ? (
              <p className={cn(ui.withIcon, "text-sm text-zinc-600")}>
                <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
                Running configuration checks…
              </p>
            ) : null}

            {!running && hasFailures ? (
              <div className="space-y-3">
                <p className={ui.alertError}>
                  Some requirements are not ready. Fix the issues above, then retry.
                </p>
                <button
                  type="button"
                  onClick={() => void runChecks()}
                  className={cn(ui.btnPrimary, ui.withIcon)}
                >
                  <RefreshCw className={ui.iconSm} aria-hidden />
                  Retry checks
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
