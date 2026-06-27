"use client";

import type { FamilyAssistancePrintRow } from "@/lib/print/faced-print-types";
import { ClipboardList, Loader2, X } from "lucide-react";
import { SkeletonScreen, SkeletonTable } from "@/components/ui/Skeleton";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type ViewAssistanceProvidedModalProps = {
  open: boolean;
  headName: string;
  loading?: boolean;
  error?: string | null;
  records: FamilyAssistancePrintRow[];
  onClose: () => void;
  onAddAssistance?: () => void;
};

function displayValue(value: string | undefined): string {
  return value?.trim() || "—";
}

export default function ViewAssistanceProvidedModal({
  open,
  headName,
  loading = false,
  error = null,
  records,
  onClose,
  onAddAssistance,
}: ViewAssistanceProvidedModalProps) {
  if (!open) return null;

  return (
    <div className={ui.modalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={cn(ui.modalWide, "flex max-h-[90vh] flex-col overflow-hidden")}
        role="dialog"
        aria-modal="true"
        aria-labelledby="view-assistance-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderInfo, ui.withIcon, "shrink-0")}>
          <ClipboardList className={ui.iconMd} aria-hidden />
          <div>
            <h3 id="view-assistance-title">Assistance provided</h3>
            <p className="mt-0.5 text-xs font-normal normal-case tracking-normal text-white/90">
              {headName}
            </p>
          </div>
        </div>

        <div className={cn(ui.modalBody, "min-h-0 flex-1 overflow-y-auto")}>
          {loading ? (
            <SkeletonScreen label="Loading assistance records">
              <SkeletonTable rows={3} columns={7} />
            </SkeletonScreen>
          ) : error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : records.length === 0 ? (
            <p className="text-sm text-zinc-600">No assistance records for this family yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={ui.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Receiving member</th>
                    <th>Assistance</th>
                    <th>Unit</th>
                    <th>Qty</th>
                    <th>Cost</th>
                    <th>Provider</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, index) => (
                    <tr key={`${row.date_provided}-${row.receiving_member_name}-${index}`}>
                      <td>{displayValue(row.date_provided)}</td>
                      <td>{displayValue(row.receiving_member_name)}</td>
                      <td>{displayValue(row.assistance_received)}</td>
                      <td>{displayValue(row.unit)}</td>
                      <td>{displayValue(row.quantity)}</td>
                      <td>{displayValue(row.cost_of_assistance)}</td>
                      <td>{displayValue(row.provider)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={cn(ui.modalActions, "shrink-0 flex-col sm:flex-row")}>
          <button
            type="button"
            onClick={onClose}
            className={cn(ui.btnSecondary, ui.withIcon, "w-full sm:w-auto")}
          >
            <X className={ui.iconSm} aria-hidden />
            Close
          </button>
          {onAddAssistance ? (
            <button
              type="button"
              onClick={onAddAssistance}
              disabled={loading}
              className={cn(ui.btnPrimary, "w-full sm:w-auto")}
            >
              Add assistance
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
