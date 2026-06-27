"use client";

import { CheckCircle2, Copy, Gift, X } from "lucide-react";
import { useState } from "react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type FamilySavedDialogProps = {
  open: boolean;
  serialNumber: string;
  mode: "created" | "updated";
  onAddAssistance: () => void;
  onCancel: () => void;
  cancelLabel?: string;
};

export default function FamilySavedDialog({
  open,
  serialNumber,
  mode,
  onAddAssistance,
  onCancel,
  cancelLabel,
}: FamilySavedDialogProps) {
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
    <div className={ui.modalBackdrop} role="presentation" onClick={onCancel}>
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="family-saved-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon)}>
          <CheckCircle2 className={ui.iconMd} aria-hidden />
          <h3 id="family-saved-title">
            {mode === "created" ? "Family saved successfully" : "Family updated successfully"}
          </h3>
        </div>
        <div className={ui.modalBody}>
          <p className="text-sm text-zinc-700">
            {mode === "created"
              ? "The family record was saved successfully. You may log assistance provided to this family, or start encoding a new family."
              : "The family record was updated successfully. You may log assistance provided or continue with another task."}
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
        <div className={cn(ui.modalActions, "flex-col sm:flex-row")}>
          <button type="button" onClick={handleCopy} className={cn(ui.btnSecondary, ui.withIcon, "w-full sm:w-auto")}>
            <Copy className={ui.iconSm} aria-hidden />
            {copied ? "Copied" : "Copy serial"}
          </button>
          <button type="button" onClick={onCancel} className={cn(ui.btnSecondary, ui.withIcon, "w-full sm:w-auto")}>
            <X className={ui.iconSm} aria-hidden />
            {cancelLabel ?? (mode === "updated" ? "Done" : "Cancel")}
          </button>
          <button
            type="button"
            onClick={onAddAssistance}
            className={cn(ui.btnPrimary, ui.withIcon, "w-full sm:w-auto")}
          >
            <Gift className={ui.iconSm} aria-hidden />
            Add assistance provided
          </button>
        </div>
      </div>
    </div>
  );
}
