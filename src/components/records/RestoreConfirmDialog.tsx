"use client";

import { RotateCcw, X } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type RestoreConfirmDialogProps = {
  open: boolean;
  headName: string;
  restoring: boolean;
  onNo: () => void;
  onYes: () => void;
};

export default function RestoreConfirmDialog({
  open,
  headName,
  restoring,
  onNo,
  onYes,
}: RestoreConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className={ui.modalBackdrop}
      role="presentation"
      onClick={restoring ? undefined : onNo}
    >
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon)}>
          <RotateCcw className={ui.iconMd} aria-hidden />
          <h3 id="restore-title">Restore record?</h3>
        </div>
        <div className={ui.modalBody}>
          <p className="text-sm text-zinc-700">
            Restore the FACED record for{" "}
            <span className="font-semibold text-ph-blue-dark">{headName}</span>?
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            The record will reappear in the main records list, exports, and duplicate checks.
          </p>
        </div>
        <div className={ui.modalActions}>
          <button type="button" onClick={onNo} disabled={restoring} className={cn(ui.btnSecondary, ui.withIcon)}>
            <X className={ui.iconSm} aria-hidden />
            Cancel
          </button>
          <button type="button" onClick={onYes} disabled={restoring} className={cn(ui.btnPrimary, ui.withIcon)}>
            <RotateCcw className={ui.iconSm} aria-hidden />
            {restoring ? "Restoring..." : "Yes, restore"}
          </button>
        </div>
      </div>
    </div>
  );
}
