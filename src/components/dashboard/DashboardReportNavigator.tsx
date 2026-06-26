"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

export type ReportNavItem = {
  id: string;
  label: string;
  detail?: string;
  meta?: string;
};

type DashboardReportNavigatorProps = {
  items: ReportNavItem[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  showAll: boolean;
  onShowAllChange: (showAll: boolean) => void;
  itemNoun?: string;
};

export default function DashboardReportNavigator({
  items,
  selectedIndex,
  onSelectIndex,
  showAll,
  onShowAllChange,
  itemNoun = "item",
}: DashboardReportNavigatorProps) {
  if (items.length <= 1) return null;

  const safeIndex = Math.min(Math.max(selectedIndex, 0), items.length - 1);
  const current = items[safeIndex];

  function goPrev() {
    onSelectIndex(safeIndex <= 0 ? items.length - 1 : safeIndex - 1);
  }

  function goNext() {
    onSelectIndex(safeIndex >= items.length - 1 ? 0 : safeIndex + 1);
  }

  return (
    <div className={cn(ui.dashboardReportNav, "no-print")} role="navigation" aria-label="Report section navigator">
      <div className={ui.dashboardReportNavMain}>
        <button type="button" className={ui.dashboardReportNavBtn} onClick={goPrev} aria-label="Previous">
          <ChevronLeft className={ui.iconMd} aria-hidden />
        </button>
        <label className={ui.dashboardReportNavSelectWrap}>
          <span className="sr-only">Select {itemNoun}</span>
          <select
            className={ui.dashboardReportNavSelect}
            value={safeIndex}
            onChange={(e) => onSelectIndex(Number.parseInt(e.target.value, 10))}
          >
            {items.map((item, index) => (
              <option key={item.id} value={index}>
                {item.label}
                {item.meta ? ` (${item.meta})` : ""}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={ui.dashboardReportNavBtn} onClick={goNext} aria-label="Next">
          <ChevronRight className={ui.iconMd} aria-hidden />
        </button>
        <span className={ui.dashboardReportNavCount}>
          {safeIndex + 1} / {items.length}
        </span>
      </div>
      {current && (current.detail || current.meta) && (
        <p className={ui.dashboardReportNavDetail}>
          {current.detail}
          {current.detail && current.meta ? " · " : ""}
          {current.meta}
        </p>
      )}
      <label className={ui.dashboardReportNavToggle}>
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => onShowAllChange(e.target.checked)}
        />
        Show all {items.length} {itemNoun}s on one page (long scroll)
      </label>
    </div>
  );
}
