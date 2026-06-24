"use client";

import { SARANGANI_PROVINCE } from "@/lib/sarangani-locations";
import { formatDuplicateMatchSummary, type VerifyMatch } from "@/lib/verify-match";

type DuplicateConfirmDialogProps = {
  open: boolean;
  matches: VerifyMatch[];
  source: "online" | "offline" | "local" | null;
  saving: boolean;
  intent: "detect" | "save";
  onCancel: () => void;
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
  onCancel,
  onContinue,
}: DuplicateConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="faced-modal-backdrop"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="faced-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="duplicate-confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="faced-modal-header faced-modal-header--warning">
          <h3 id="duplicate-confirm-title">Possible duplicate found</h3>
        </div>
        <div className="faced-modal-body">
          <p className="text-sm text-zinc-700">
            {matches.length === 1
              ? "A matching beneficiary was found"
              : `${matches.length} matching beneficiaries were found`}{" "}
            in {sourceLabel(source)}.
            {intent === "detect"
              ? " Review the match below before continuing."
              : " Continue only if you have confirmed this is not a duplicate."}
          </p>
          <ul className="encode-duplicate-list mt-3">
            {matches.slice(0, 3).map((match) => (
              <li key={match.uuid} className="encode-duplicate-item">
                <span className="font-semibold text-[var(--ph-blue-dark)]">
                  {match.headName}
                </span>
                <span className="text-zinc-600">
                  {" "}
                  — {formatDuplicateMatchSummary(match, SARANGANI_PROVINCE)}
                </span>
              </li>
            ))}
          </ul>
          {matches.length > 3 ? (
            <p className="encode-duplicate-more">+{matches.length - 3} more match(es)</p>
          ) : null}
        </div>
        <div className="faced-modal-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="faced-btn-secondary"
          >
            Go back
          </button>
          <button
            type="button"
            onClick={onContinue}
            disabled={saving}
            className="faced-btn-primary"
          >
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
