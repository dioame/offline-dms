"use client";

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
    <div className="dashboard-report-nav no-print" role="navigation" aria-label="Report section navigator">
      <div className="dashboard-report-nav-main">
        <button type="button" className="dashboard-report-nav-btn" onClick={goPrev} aria-label="Previous">
          ←
        </button>
        <label className="dashboard-report-nav-select-wrap">
          <span className="sr-only">Select {itemNoun}</span>
          <select
            className="dashboard-report-nav-select"
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
        <button type="button" className="dashboard-report-nav-btn" onClick={goNext} aria-label="Next">
          →
        </button>
        <span className="dashboard-report-nav-count">
          {safeIndex + 1} / {items.length}
        </span>
      </div>
      {current && (current.detail || current.meta) && (
        <p className="dashboard-report-nav-detail">
          {current.detail}
          {current.detail && current.meta ? " · " : ""}
          {current.meta}
        </p>
      )}
      <label className="dashboard-report-nav-toggle">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(e) => onShowAllChange(e.target.checked)}
        />
        Show all {items.length} {itemNoun}s (long scroll)
      </label>
    </div>
  );
}
