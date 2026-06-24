type TrashRowActionsProps = {
  onView: () => void;
  onRestore: () => void;
};

export default function TrashRowActions({ onView, onRestore }: TrashRowActionsProps) {
  return (
    <div className="record-actions">
      <button type="button" onClick={onView} className="record-action-btn record-action-btn--view">
        View
      </button>
      <button type="button" onClick={onRestore} className="record-action-btn record-action-btn--edit">
        Restore
      </button>
    </div>
  );
}
