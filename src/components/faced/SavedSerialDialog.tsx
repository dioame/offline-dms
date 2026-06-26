"use client";

import { CheckCircle2, Copy } from "lucide-react";
import { useState } from "react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type SavedSerialDialogProps = {
  open: boolean;
  serialNumber: string;
  mode: "created" | "updated";
  onClose: () => void;
};

export default function SavedSerialDialog({
  open,
  serialNumber,
  mode,
  onClose,
}: SavedSerialDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(serialNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={ui.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="saved-serial-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon)}>
          <CheckCircle2 className={ui.iconMd} aria-hidden />
          <h3 id="saved-serial-title">
            {mode === "created" ? "Record saved" : "Record updated"}
          </h3>
        </div>
        <div className={ui.modalBody}>
          <p className="text-sm text-zinc-700">
            {mode === "created"
              ? "The family record was saved successfully. Use this serial number for printing and verification."
              : "The family record was updated successfully. The serial number is shown below."}
          </p>
          <div className="mt-4 rounded-lg border border-faced-blue-border bg-zinc-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Family serial number
            </p>
            <p className="mt-1 font-mono text-lg font-bold tracking-wide text-ph-blue-dark">
              {serialNumber}
            </p>
          </div>
        </div>
        <div className={ui.modalActions}>
          <button type="button" onClick={handleCopy} className={cn(ui.btnSecondary, ui.withIcon)}>
            <Copy className={ui.iconSm} aria-hidden />
            {copied ? "Copied" : "Copy serial"}
          </button>
          <button type="button" onClick={onClose} className={ui.btnPrimary}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
