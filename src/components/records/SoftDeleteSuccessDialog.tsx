"use client";

import { CheckCircle2 } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type SoftDeleteSuccessDialogProps = {
  open: boolean;
  headName: string;
  onClose: () => void;
};

export default function SoftDeleteSuccessDialog({
  open,
  headName,
  onClose,
}: SoftDeleteSuccessDialogProps) {
  if (!open) return null;

  return (
    <div className={ui.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="soft-delete-success-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon)}>
          <CheckCircle2 className={ui.iconMd} aria-hidden />
          <h3 id="soft-delete-success-title">Record soft-deleted</h3>
        </div>
        <div className={ui.modalBody}>
          <p className="text-sm text-zinc-700">
            The FACED record for{" "}
            <span className="font-semibold text-ph-blue-dark">{headName}</span> was successfully
            soft-deleted.
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            It has been removed from the main list, exports, and duplicate checks. You can restore
            it from the Deleted records section.
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
