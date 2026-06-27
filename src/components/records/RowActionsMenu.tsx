"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

export type RowActionItem = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "success";
};

type RowActionsMenuProps = {
  items: RowActionItem[];
  label?: string;
};

type MenuPosition = {
  top: number;
  left: number;
  minWidth: number;
};

export default function RowActionsMenu({ items, label = "Actions" }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  function updateMenuPosition() {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const minWidth = 240;
    const left = Math.min(rect.right - minWidth, window.innerWidth - minWidth - 8);
    setMenuPosition({
      top: rect.bottom + 4,
      left: Math.max(8, left),
      minWidth,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function itemClass(variant: RowActionItem["variant"] = "default") {
    return cn(
      "flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold transition",
      variant === "danger"
        ? "text-ph-red hover:bg-ph-red-light"
        : variant === "success"
          ? "text-green-800 hover:bg-green-50"
          : "text-zinc-700 hover:bg-ph-blue-light",
      "disabled:cursor-not-allowed disabled:opacity-50",
    );
  }

  return (
    <div ref={rootRef} className="relative inline-flex justify-end">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className={cn(ui.recordActionEdit, ui.withIcon)}
      >
        {label}
        <ChevronDown className={cn(ui.iconSm, "transition", open && "rotate-180")} aria-hidden />
      </button>
      {open && menuPosition ? (
        <div
          id={menuId}
          role="menu"
          style={{
            position: "fixed",
            top: menuPosition.top,
            left: menuPosition.left,
            minWidth: menuPosition.minWidth,
          }}
          className="z-50 overflow-hidden rounded-md border border-faced-blue-border bg-white py-1 shadow-lg"
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={itemClass(item.variant)}
              >
                <Icon className={ui.iconSm} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
