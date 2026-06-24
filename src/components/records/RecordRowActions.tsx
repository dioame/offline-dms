type RecordRowActionsProps = {
  onView: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
  printing?: boolean;
};

export default function RecordRowActions({
  onView,
  onEdit,
  onPrint,
  onDelete,
  printing = false,
}: RecordRowActionsProps) {
  return (
    <div className="record-actions">
      <button type="button" onClick={onView} className="record-action-btn record-action-btn--view">
        View
      </button>
      <button type="button" onClick={onEdit} className="record-action-btn record-action-btn--edit">
        Edit
      </button>
      <button
        type="button"
        onClick={onPrint}
        disabled={printing}
        className="record-action-btn record-action-btn--print"
      >
        {printing ? "Printing…" : "Print FACED"}
      </button>
      <button type="button" onClick={onDelete} className="record-action-btn record-action-btn--delete">
        Delete
      </button>
    </div>
  );
}
