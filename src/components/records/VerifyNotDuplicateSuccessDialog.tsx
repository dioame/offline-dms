"use client";

import { CheckCircle2 } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type VerifyNotDuplicateSuccessDialogProps = {
  open: boolean;
  headName: string;
  pairCount: number;
  onClose: () => void;
};

export default function VerifyNotDuplicateSuccessDialog({
  open,
  headName,
  pairCount,
  onClose,
}: VerifyNotDuplicateSuccessDialogProps) {
  if (!open) return null;

  return (
    <div className={ui.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="verify-not-duplicate-success-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon)}>
          <CheckCircle2 className={ui.iconMd} aria-hidden />
          <h3 id="verify-not-duplicate-success-title">Verified distinct families</h3>
        </div>
        <div className={ui.modalBody}>
          <p className="text-sm text-zinc-700">
            The records for{" "}
            <span className="font-semibold text-ph-blue-dark">{headName}</span> were marked as
            verified distinct families.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            {pairCount === 1
              ? "1 pair exclusion was saved."
              : `${pairCount} pair exclusions were saved.`}{" "}
            They will no longer appear together in the duplicates list.
          </p>
        </div>
        <div className={ui.modalActions}>
          <button type="button" onClick={onClose} className={ui.btnPrimary}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
