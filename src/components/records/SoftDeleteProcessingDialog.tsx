"use client";

import { Loader2, Trash2 } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type SoftDeleteProcessingDialogProps = {
  open: boolean;
  headName: string;
};

export default function SoftDeleteProcessingDialog({
  open,
  headName,
}: SoftDeleteProcessingDialogProps) {
  if (!open) return null;

  return (
    <div className={ui.modalBackdrop} role="presentation">
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-busy="true"
        aria-labelledby="soft-delete-processing-title"
        aria-live="polite"
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderDanger, ui.withIcon)}>
          <Trash2 className={ui.iconMd} aria-hidden />
          <h3 id="soft-delete-processing-title">Soft deleting record</h3>
        </div>
        <div className={ui.modalBody}>
          <div className="flex flex-col items-center py-2 text-center">
            <Loader2 className={cn(ui.iconLg, "animate-spin text-ph-blue")} aria-hidden />
            <p className="mt-4 text-sm font-medium text-zinc-800">Please wait…</p>
            <p className="mt-2 text-sm text-zinc-600">
              Soft deleting the FACED record for{" "}
              <span className="font-semibold text-ph-blue-dark">{headName}</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
