import { Eye, Pencil, Printer, Trash2 } from "lucide-react";
import RowActionsMenu from "./RowActionsMenu";

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
    <RowActionsMenu
      items={[
        { label: "View", icon: Eye, onClick: onView },
        { label: "Edit", icon: Pencil, onClick: onEdit },
        {
          label: printing ? "Printing…" : "Print FACED",
          icon: Printer,
          onClick: onPrint,
          disabled: printing,
          variant: "success",
        },
        { label: "Delete", icon: Trash2, onClick: onDelete, variant: "danger" },
      ]}
    />
  );
}
