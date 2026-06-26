import { Eye, IdCard, Pencil, Printer, Trash2 } from "lucide-react";
import RowActionsMenu from "./RowActionsMenu";

type RecordRowActionsProps = {
  onView: () => void;
  onEdit: () => void;
  onPrint: () => void;
  onGenerateId: () => void;
  onDelete: () => void;
  printing?: boolean;
  generatingId?: boolean;
};

export default function RecordRowActions({
  onView,
  onEdit,
  onPrint,
  onGenerateId,
  onDelete,
  printing = false,
  generatingId = false,
}: RecordRowActionsProps) {
  const busy = printing || generatingId;

  return (
    <RowActionsMenu
      items={[
        { label: "View", icon: Eye, onClick: onView },
        { label: "Edit", icon: Pencil, onClick: onEdit },
        {
          label: printing ? "Printing…" : "Print FACED",
          icon: Printer,
          onClick: onPrint,
          disabled: busy,
          variant: "success",
        },
        {
          label: generatingId ? "Generating…" : "Generate FACED ID",
          icon: IdCard,
          onClick: onGenerateId,
          disabled: busy,
          variant: "success",
        },
        { label: "Delete", icon: Trash2, onClick: onDelete, variant: "danger" },
      ]}
    />
  );
}
