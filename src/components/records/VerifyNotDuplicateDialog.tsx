"use client";

import { ShieldCheck, X } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type VerifyNotDuplicateDialogProps = {
  open: boolean;
  headName: string;
  recordCount: number;
  verifying: boolean;
  onNo: () => void;
  onYes: () => void;
};

export default function VerifyNotDuplicateDialog({
  open,
  headName,
  recordCount,
  verifying,
  onNo,
  onYes,
}: VerifyNotDuplicateDialogProps) {
  if (!open) return null;

  return (
    <div
      className={ui.modalBackdrop}
      role="presentation"
      onClick={verifying ? undefined : onNo}
    >
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-not-duplicate-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon)}>
          <ShieldCheck className={ui.iconMd} aria-hidden />
          <h3 id="verify-not-duplicate-title">Verify not duplicates</h3>
        </div>
        <div className={ui.modalBody}>
          <p className="text-sm text-zinc-700">
            Confirm that the {recordCount} records for{" "}
            <span className="font-semibold text-ph-blue-dark">{headName}</span> are{" "}
            <strong>distinct families</strong>, not duplicates.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            They will be removed from this duplicates list. Future encoding will only flag a match
            when middle name or birthdate also aligns more closely.
          </p>
        </div>
        <div className={ui.modalActions}>
          <button type="button" onClick={onNo} disabled={verifying} className={cn(ui.btnSecondary, ui.withIcon)}>
            <X className={ui.iconSm} aria-hidden />
            Cancel
          </button>
          <button type="button" onClick={onYes} disabled={verifying} className={cn(ui.btnPrimary, ui.withIcon)}>
            <ShieldCheck className={ui.iconSm} aria-hidden />
            {verifying ? "Saving..." : "Verify not duplicates"}
          </button>
        </div>
      </div>
    </div>
  );
}
