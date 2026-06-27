"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FileText, Loader2, Minimize2, Maximize2, Terminal, X } from "lucide-react";
import { FormField, SelectInput } from "@/components/faced/FormField";
import { SARANGANI_PROVINCE, municipalityOptions, barangayOptions } from "@/lib/sarangani-locations";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

export type FacedBatchFilter = {
  city_municipality: string;
  barangay: string;
};

export type FacedBatchModalPhase = "filter" | "terminal";

type GenerateFacedBatchModalProps = {
  open: boolean;
  minimized: boolean;
  phase: FacedBatchModalPhase;
  running: boolean;
  logs: string[];
  terminalTitle: string;
  onClose: () => void;
  onMinimize: () => void;
  onRestore: () => void;
  onGenerate: (filter: FacedBatchFilter) => void;
};

function TerminalLog({ logs, running }: { logs: string[]; running: boolean }) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs, running]);

  return (
    <div
      className="max-h-[min(28rem,55vh)] overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-emerald-400"
      role="log"
    >
      {logs.length === 0 ? (
        <p className="text-zinc-500">&gt; Starting batch terminal…</p>
      ) : (
        logs.map((line, index) => (
          <p
            key={`${index}-${line.slice(0, 24)}`}
            className={cn(
              line.startsWith("✗") && "text-red-400",
              line.startsWith("!") && "text-amber-400",
              line.startsWith("✓") && "text-emerald-300",
            )}
          >
            {line}
          </p>
        ))
      )}
      {running ? (
        <p className="mt-1 flex items-center gap-2 text-zinc-400">
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
          Background worker running…
        </p>
      ) : null}
      <div ref={logEndRef} />
    </div>
  );
}

export default function GenerateFacedBatchModal({
  open,
  minimized,
  phase,
  running,
  logs,
  terminalTitle,
  onClose,
  onMinimize,
  onRestore,
  onGenerate,
}: GenerateFacedBatchModalProps) {
  const [cityMunicipality, setCityMunicipality] = useState("");
  const [barangay, setBarangay] = useState("");
  const [mounted, setMounted] = useState(false);

  const barangaySelectOptions = useMemo(
    () => barangayOptions(cityMunicipality),
    [cityMunicipality],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleMunicipalityChange(value: string) {
    setCityMunicipality(value);
    setBarangay("");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!cityMunicipality.trim() || running) return;
    onGenerate({ city_municipality: cityMunicipality.trim(), barangay: barangay.trim() });
  }

  if (!open || !mounted) return null;

  const areaLabel = barangay
    ? `${barangay}, ${cityMunicipality}`
    : `${cityMunicipality} (all barangays)`;

  const showTerminal = phase === "terminal";
  const lastLog = logs[logs.length - 1] ?? "";

  if (minimized) {
    return createPortal(
      <button
        type="button"
        onClick={onRestore}
        className={cn(
          "fixed bottom-4 right-4 z-[200] flex max-w-[min(20rem,90vw)] items-center gap-2 rounded-full border border-zinc-700",
          "bg-zinc-900 px-4 py-2.5 text-left text-xs text-emerald-300 shadow-2xl",
          "transition hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-ph-blue",
        )}
        aria-label="Restore batch PDF terminal"
      >
        {running ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-emerald-400" aria-hidden />
        ) : (
          <Terminal className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate font-medium">{terminalTitle}</span>
        <Maximize2 className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden />
      </button>,
      document.body,
    );
  }

  if (showTerminal) {
    return createPortal(
      <div
        className="fixed bottom-4 right-4 z-[200] w-[min(36rem,96vw)] overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-2xl"
        role="dialog"
        aria-modal="false"
        aria-labelledby="generate-faced-batch-title"
        aria-live="polite"
      >
        <div className={cn("flex items-center justify-between px-4 py-3 text-white", "bg-zinc-800")}>
          <div className={cn("flex min-w-0 items-center gap-2", ui.withIcon)}>
            <Terminal className={ui.iconMd} aria-hidden />
            <h3 id="generate-faced-batch-title" className="truncate text-sm font-bold">
              {terminalTitle}
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onMinimize}
              className="rounded p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              aria-label="Minimize terminal"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={running ? onMinimize : onClose}
              className="rounded p-1.5 text-zinc-300 hover:bg-zinc-700 hover:text-white"
              aria-label={running ? "Minimize terminal" : "Close terminal"}
              title={running ? "Minimize" : "Close"}
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="p-4">
          <p className="mb-3 text-sm text-zinc-600">
            Running in the background — minimize and navigate anywhere. The PDF downloads
            automatically when ready.
          </p>
          <TerminalLog logs={logs} running={running} />
          {lastLog.startsWith("✓ Downloaded") ? (
            <p className={cn(ui.alertSuccess, "mt-3 text-xs")}>{lastLog.replace(/^✓\s*/, "")}</p>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-200 px-4 py-3">
          <button
            type="button"
            onClick={onMinimize}
            className={cn(ui.btnSecondary, "text-xs", ui.withIcon)}
          >
            <Minimize2 className={ui.iconSm} aria-hidden />
            Minimize
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={running}
            className={cn(ui.btnSecondary, "text-xs", ui.withIcon)}
          >
            <X className={ui.iconSm} aria-hidden />
            {running ? "Running…" : "Close"}
          </button>
        </div>
      </div>,
      document.body,
    );
  }

  return createPortal(
    <div className={ui.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="generate-faced-batch-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon)}>
          <FileText className={ui.iconMd} aria-hidden />
          <h3 id="generate-faced-batch-title">Generate FACED forms (batch)</h3>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={ui.modalBody}>
            <p className="text-sm text-zinc-600">
              Choose a municipality and optionally a barangay. The job runs in a background worker
              — you can minimize the terminal and keep using the app.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField label="City / Municipality" required>
                <SelectInput
                  value={cityMunicipality}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                  options={municipalityOptions()}
                  placeholder="Select municipality"
                  required
                />
              </FormField>
              <FormField label="Barangay">
                <SelectInput
                  value={barangay}
                  onChange={(e) => setBarangay(e.target.value)}
                  options={barangaySelectOptions}
                  placeholder={
                    cityMunicipality ? "All barangays (optional)" : "Select municipality first"
                  }
                  disabled={!cityMunicipality}
                />
              </FormField>
            </div>

            {cityMunicipality ? (
              <div className={cn(ui.alertSuccess, "mt-4")}>
                Ready to queue PDF for <strong>{areaLabel}</strong>, {SARANGANI_PROVINCE}.
              </div>
            ) : null}
          </div>
          <div className={ui.modalActions}>
            <button type="button" onClick={onClose} className={cn(ui.btnSecondary, ui.withIcon)}>
              <X className={ui.iconSm} aria-hidden />
              Cancel
            </button>
            <button
              type="submit"
              disabled={!cityMunicipality.trim() || running}
              className={cn(ui.btnPrimary, ui.withIcon)}
            >
              <Terminal className={ui.iconSm} aria-hidden />
              Generate batch
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
