"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import GenerateFacedBatchModal, {
  type FacedBatchFilter,
  type FacedBatchModalPhase,
} from "@/components/records/GenerateFacedBatchModal";
import { buildFacedBatchPdfFilename } from "@/lib/batch-pdf/filename";

const ADMIN_STORAGE_KEY = "dms_admin_password";

type BatchPdfJobContextValue = {
  running: boolean;
  panelOpen: boolean;
  minimized: boolean;
  openFilter: () => void;
  minimize: () => void;
  restore: () => void;
  closePanel: () => void;
  startBatch: (filter: FacedBatchFilter) => Promise<void>;
};

const BatchPdfJobContext = createContext<BatchPdfJobContextValue | null>(null);

export function useBatchPdfJob(): BatchPdfJobContextValue {
  const ctx = useContext(BatchPdfJobContext);
  if (!ctx) {
    throw new Error("useBatchPdfJob must be used within BatchPdfJobProvider");
  }
  return ctx;
}

export function BatchPdfJobProvider({ children }: { children: React.ReactNode }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [phase, setPhase] = useState<FacedBatchModalPhase>("filter");
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [title, setTitle] = useState("Batch FACED form generation");
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const pollGenerationRef = useRef(0);

  const adminFetch = useCallback(async (path: string, init?: RequestInit) => {
    const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY) ?? "";
    return fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": stored,
        ...init?.headers,
      },
    });
  }, []);

  const downloadBatchPdfFile = useCallback(
    async (jobId: string, filename: string) => {
      const res = await adminFetch(`/api/admin/records/batch-pdf/${jobId}/download`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to download PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    [adminFetch],
  );

  const openFilter = useCallback(() => {
    if (running) {
      setPanelOpen(true);
      setMinimized(false);
      return;
    }
    setPhase("filter");
    setPanelOpen(true);
    setMinimized(false);
    setLogs([]);
    setTitle("Generate FACED forms (batch)");
  }, [running]);

  const closePanel = useCallback(() => {
    if (running) return;
    setPanelOpen(false);
    setMinimized(false);
    setPhase("filter");
    setLogs([]);
    setActiveJobId(null);
  }, [running]);

  const minimize = useCallback(() => {
    setMinimized(true);
  }, []);

  const restore = useCallback(() => {
    setMinimized(false);
    setPanelOpen(true);
  }, []);

  const startBatch = useCallback(
    async (filter: FacedBatchFilter) => {
      const { city_municipality, barangay } = filter;
      const areaLabel = barangay
        ? `${barangay}, ${city_municipality}`
        : `${city_municipality} (all barangays)`;

      setPhase("terminal");
      setPanelOpen(true);
      setMinimized(false);
      setRunning(true);
      setActiveJobId(null);
      setLogs(["> Batch terminal opened.", "> Submitting job to background worker…"]);
      setTitle(`Generate FACED PDF — ${areaLabel}`);

      try {
        const startRes = await adminFetch("/api/admin/records/batch-pdf", {
          method: "POST",
          body: JSON.stringify({
            city_municipality,
            ...(barangay ? { barangay } : {}),
          }),
        });
        const startData = await startRes.json();
        if (!startRes.ok) {
          throw new Error(startData.error || "Failed to start background PDF job.");
        }

        setLogs([
          ...(startData.logs ?? []),
          `> Job ID: ${startData.jobId}`,
          "> Waiting for background worker (polling every 2s)…",
        ]);
        setActiveJobId(String(startData.jobId));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Batch generation failed.";
        setLogs((prev) => [...prev, `✗ ${message}`]);
        setRunning(false);
        setActiveJobId(null);
      }
    },
    [adminFetch],
  );

  useEffect(() => {
    if (!activeJobId || !running) return;

    const jobId = activeJobId;
    const generation = pollGenerationRef.current + 1;
    pollGenerationRef.current = generation;
    let cancelled = false;

    async function pollJob() {
      try {
        for (;;) {
          if (cancelled || pollGenerationRef.current !== generation) return;

          await new Promise((resolve) => window.setTimeout(resolve, 2000));

          const res = await adminFetch(`/api/admin/records/batch-pdf/${jobId}`);
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || "Failed to read batch job status.");
          }

          if (cancelled || pollGenerationRef.current !== generation) return;
          setLogs(data.logs ?? []);

          if (data.status === "complete") {
            setLogs((prev) => [...(data.logs ?? prev), "> Downloading completed PDF…"]);
            const filename = String(data.filename ?? buildFacedBatchPdfFilename("", ""));
            await downloadBatchPdfFile(jobId, filename);
            if (cancelled || pollGenerationRef.current !== generation) return;
            setLogs((prev) => [...prev, `✓ Downloaded ${filename}`]);
            setRunning(false);
            setActiveJobId(null);
            return;
          }

          if (data.status === "failed") {
            throw new Error(data.error || "Background PDF generation failed.");
          }
        }
      } catch (err) {
        if (cancelled || pollGenerationRef.current !== generation) return;
        const message = err instanceof Error ? err.message : "Batch generation failed.";
        setLogs((prev) => [...prev, `✗ ${message}`]);
        setRunning(false);
        setActiveJobId(null);
      }
    }

    void pollJob();

    return () => {
      cancelled = true;
    };
  }, [activeJobId, running, adminFetch, downloadBatchPdfFile]);

  const value = useMemo(
    () => ({
      running,
      panelOpen,
      minimized,
      openFilter,
      minimize,
      restore,
      closePanel,
      startBatch,
    }),
    [running, panelOpen, minimized, openFilter, minimize, restore, closePanel, startBatch],
  );

  return (
    <BatchPdfJobContext.Provider value={value}>
      {children}
      <GenerateFacedBatchModal
        open={panelOpen}
        minimized={minimized}
        phase={phase}
        running={running}
        logs={logs}
        terminalTitle={title}
        onClose={closePanel}
        onMinimize={minimize}
        onRestore={restore}
        onGenerate={(filter) => void startBatch(filter)}
      />
    </BatchPdfJobContext.Provider>
  );
}
