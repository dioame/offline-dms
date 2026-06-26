"use client";

import { AlertTriangle, ArrowLeft, Save } from "lucide-react";
import { SARANGANI_PROVINCE } from "@/lib/sarangani-locations";
import { formatDuplicateMatchSummary, type VerifyMatch } from "@/lib/verify-match";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type DuplicateConfirmDialogProps = {
  open: boolean;
  matches: VerifyMatch[];
  source: "online" | "offline" | "local" | null;
  saving: boolean;
  intent: "detect" | "save";
  onDismiss: () => void;
  onGoBack: () => void;
  onContinue: () => void;
};

function sourceLabel(source: DuplicateConfirmDialogProps["source"]): string {
  if (source === "online") return "synced online records";
  if (source === "offline") return "your downloaded offline copy";
  if (source === "local") return "records saved on this device";
  return "available records";
}

export default function DuplicateConfirmDialog({
  open,
  matches,
  source,
  saving,
  intent,
  onDismiss,
  onGoBack,
  onContinue,
}: DuplicateConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className={ui.modalBackdrop} role="presentation" onClick={onDismiss}>
      <div
        className={ui.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={cn(ui.modalHeader, ui.modalHeaderWarning, ui.withIcon)}>
          <AlertTriangle className={ui.iconMd} aria-hidden />
          <h3 id="duplicate-confirm-title">Possible duplicate found</h3>
        </div>
        <div className={ui.modalBody}>
          <p className="text-sm text-zinc-700">
            {matches.length === 1
              ? "A matching beneficiary was found"
              : `${matches.length} matching beneficiaries were found`}{" "}
            in {sourceLabel(source)}.
            {intent === "detect"
              ? " Review the match below before continuing."
              : " Continue only if you have confirmed this is not a duplicate."}
          </p>
          <ul className={`${ui.encodeDuplicateList} mt-3`}>
            {matches.slice(0, 3).map((match) => (
              <li key={match.uuid} className={ui.encodeDuplicateItem}>
                <span className="font-semibold text-ph-blue-dark">{match.headName}</span>
                <span className="text-zinc-600">
                  {" "}
                  — {formatDuplicateMatchSummary(match, SARANGANI_PROVINCE)}
                </span>
              </li>
            ))}
          </ul>
          {matches.length > 3 ? (
            <p className={ui.encodeDuplicateMore}>+{matches.length - 3} more match(es)</p>
          ) : null}
        </div>
        <div className={ui.modalActions}>
          <button type="button" onClick={onGoBack} disabled={saving} className={cn(ui.btnSecondary, ui.withIcon)}>
            <ArrowLeft className={ui.iconSm} aria-hidden />
            Go back
          </button>
          <button type="button" onClick={onContinue} disabled={saving} className={cn(ui.btnPrimary, ui.withIcon)}>
            <Save className={ui.iconSm} aria-hidden />
            {saving
              ? "Saving..."
              : intent === "save"
                ? "Save anyway"
                : "Continue encoding"}
          </button>
        </div>
      </div>
    </div>
  );
}
