"use client";

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
      className="faced-modal-backdrop"
      role="presentation"
      onClick={restoring ? undefined : onNo}
    >
      <div
        className="faced-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="restore-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="faced-modal-header">
          <h3 id="restore-title">Restore record?</h3>
        </div>
        <div className="faced-modal-body">
          <p className="text-sm text-zinc-700">
            Restore the FACED record for{" "}
            <span className="font-semibold text-[var(--ph-blue-dark)]">{headName}</span>?
          </p>
          <p className="mt-2 text-sm text-zinc-600">
            The record will reappear in the main records list, exports, and duplicate checks.
          </p>
        </div>
        <div className="faced-modal-actions">
          <button type="button" onClick={onNo} disabled={restoring} className="faced-btn-secondary">
            Cancel
          </button>
          <button type="button" onClick={onYes} disabled={restoring} className="faced-btn-primary">
            {restoring ? "Restoring..." : "Yes, restore"}
          </button>
        </div>
      </div>
    </div>
  );
}
