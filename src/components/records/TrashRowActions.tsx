import { Eye, RotateCcw } from "lucide-react";
import RowActionsMenu from "./RowActionsMenu";

type TrashRowActionsProps = {
  onView: () => void;
  onRestore: () => void;
};

export default function TrashRowActions({ onView, onRestore }: TrashRowActionsProps) {
  return (
    <RowActionsMenu
      items={[
        { label: "View", icon: Eye, onClick: onView },
        { label: "Restore", icon: RotateCcw, onClick: onRestore },
      ]}
    />
  );
}
