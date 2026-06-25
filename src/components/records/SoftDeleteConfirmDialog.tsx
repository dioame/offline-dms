"use client";

import { Trash2, X } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type SoftDeleteConfirmDialogProps = {
  open: boolean;
  headName: string;
  deleting: boolean;
  onNo: () => void;
  onYes: () => void;
};

export default function SoftDeleteConfirmDialog({
  open,
  headName,
  deleting,
  onNo,
  onYes,
}: SoftDeleteConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className={ui.modalBackdrop}
      role="presentation"
      onClick={deleting ? undefined : onNo}
    >
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="soft-delete-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderDanger, ui.withIcon)}>
          <Trash2 className={ui.iconMd} aria-hidden />
          <h3 id="soft-delete-title">Delete record?</h3>
        </div>
        <div className={ui.modalBody}>
          <p className="text-sm text-zinc-700">
            Delete the FACED record for{" "}
            <span className="font-semibold text-ph-blue-dark">{headName}</span>?
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            The record will be removed from lists, exports, and duplicate checks.
          </p>
        </div>
        <div className={ui.modalActions}>
          <button type="button" onClick={onNo} disabled={deleting} className={cn(ui.btnSecondary, ui.withIcon)}>
            <X className={ui.iconSm} aria-hidden />
            No
          </button>
          <button type="button" onClick={onYes} disabled={deleting} className={cn(ui.btnDanger, ui.withIcon)}>
            <Trash2 className={ui.iconSm} aria-hidden />
            {deleting ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
