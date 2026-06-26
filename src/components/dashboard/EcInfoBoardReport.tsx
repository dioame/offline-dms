"use client";

import { useMemo } from "react";
import type { AgeRow, InfoBoardGroup, SectoralRow } from "@/lib/dashboard-types";
import { SARANGANI_REGION, formatDisplayBarangay } from "@/lib/sarangani-locations";
import type { ReportNavItem } from "@/components/dashboard/DashboardReportNavigator";
import DashboardReportNavigator from "@/components/dashboard/DashboardReportNavigator";
import { cn } from "@/lib/cn";
import * as ui from "@/lib/ui";

type CountTotals = {
  male_cum: number;
  male_now: number;
  female_cum: number;
  female_now: number;
  total_cum: number;
  total_now: number;
};

function sumAgeRows(rows: AgeRow[]): CountTotals {
  return rows.reduce(
    (acc, row) => ({
      male_cum: acc.male_cum + row.male_cum,
      male_now: acc.male_now + row.male_now,
      female_cum: acc.female_cum + row.female_cum,
      female_now: acc.female_now + row.female_now,
      total_cum: acc.total_cum + row.total_cum,
      total_now: acc.total_now + row.total_now,
    }),
    { male_cum: 0, male_now: 0, female_cum: 0, female_now: 0, total_cum: 0, total_now: 0 },
  );
}

function sumSectoralRows(rows: SectoralRow[]): CountTotals {
  return rows.reduce(
    (acc, row) => ({
      male_cum: acc.male_cum + row.male_cum,
      male_now: acc.male_now + row.male_now,
      female_cum: acc.female_cum + row.female_cum,
      female_now: acc.female_now + row.female_now,
      total_cum: acc.total_cum + row.total_cum,
      total_now: acc.total_now + row.total_now,
    }),
    { male_cum: 0, male_now: 0, female_cum: 0, female_now: 0, total_cum: 0, total_now: 0 },
  );
}

function formatAsOfDate(date = new Date()) {
  return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function MetricCells({
  row,
  nowOnly,
  bold = false,
}: {
  row: CountTotals | AgeRow | SectoralRow;
  nowOnly?: boolean;
  bold?: boolean;
}) {
  const cellClass = bold
    ? cn(ui.ecBoardTd, ui.ecBoardTdMetric, ui.ecBoardTdBold)
    : cn(ui.ecBoardTd, ui.ecBoardTdMetric);
  if (nowOnly) {
    return (
      <>
        <td className={cellClass}>{row.male_now}</td>
        <td className={cellClass}>{row.female_now}</td>
        <td className={cn(cellClass, ui.ecBoardTdTotal)}>{row.total_now}</td>
      </>
    );
  }
  return (
    <>
      <td className={cellClass}>{row.male_cum}</td>
      <td className={cellClass}>{row.male_now}</td>
      <td className={cellClass}>{row.female_cum}</td>
      <td className={cellClass}>{row.female_now}</td>
      <td className={cn(cellClass, ui.ecBoardTdTotal)}>{row.total_cum}</td>
      <td className={cn(cellClass, ui.ecBoardTdTotal)}>{row.total_now}</td>
    </>
  );
}

function DisaggregationTable({
  rows,
  nowOnly,
  labelHeader,
}: {
  rows: AgeRow[] | SectoralRow[];
  nowOnly?: boolean;
  labelHeader: string;
}) {
  const isAge = labelHeader.toLowerCase().includes("age");
  const totals = isAge ? sumAgeRows(rows as AgeRow[]) : sumSectoralRows(rows as SectoralRow[]);

  return (
    <div className={ui.ecBoardTableWrap}>
      <table className={ui.ecBoardTable}>
        <thead>
          <tr className="ec-board-thead-title">
            <th className={cn(ui.ecBoardTh, ui.ecBoardThLabel)} rowSpan={nowOnly ? 1 : 2}>
              {labelHeader}
            </th>
            {nowOnly ? (
              <>
                <th className={ui.ecBoardTh}>Male</th>
                <th className={ui.ecBoardTh}>Female</th>
                <th className={ui.ecBoardTh}>Total</th>
              </>
            ) : (
              <>
                <th className={ui.ecBoardTh} colSpan={2}>Male</th>
                <th className={ui.ecBoardTh} colSpan={2}>Female</th>
                <th className={ui.ecBoardTh} colSpan={2}>Total</th>
              </>
            )}
          </tr>
          {!nowOnly && (
            <tr className="ec-board-thead-sub">
              <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>CUM</th>
              <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>NOW</th>
              <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>CUM</th>
              <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>NOW</th>
              <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>CUM</th>
              <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>NOW</th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? ui.ecBoardRowAlt : undefined}>
              <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>
                {isAge ? (
                  <>
                    <span className={ui.ecBoardAgeName}>{(row as AgeRow).label || (row as AgeRow).group}</span>
                    {(row as AgeRow).range && (
                      <span className={ui.ecBoardAgeRange}>{(row as AgeRow).range}</span>
                    )}
                  </>
                ) : (
                  (row as SectoralRow).label
                )}
              </td>
              <MetricCells row={row} nowOnly={nowOnly} />
            </tr>
          ))}
          <tr className={ui.ecBoardRowTotal}>
            <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>TOTAL &gt;&gt;&gt;</td>
            <MetricCells row={totals} nowOnly={nowOnly} bold />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

type EcInfoBoardReportProps = {
  data: InfoBoardGroup;
  nowOnly?: boolean;
  title?: string;
  groupLabel?: string;
};

export default function EcInfoBoardReport({
  data,
  nowOnly = true,
  title = "EVACUATION CENTER INFORMATION BOARD",
  groupLabel,
}: EcInfoBoardReportProps) {
  return (
    <article className="ec-info-board-report" aria-label="Evacuation Center Information Board">
      <header className="ec-board-header">
        <h2 className="ec-board-title">EVACUATION CENTER INFORMATION BOARD</h2>
        <div className="ec-board-as-of">As of {formatAsOfDate()}</div>
      </header>

      <section>
        <table className={ui.ecBoardMetaTable}>
          <tbody>
            <tr>
              <td className={ui.ecBoardMetaCell}>
                <span className={ui.ecBoardMetaLabel}>Region:</span>{" "}
                <span className={ui.ecBoardMetaValue}>{data.region || SARANGANI_REGION}</span>
              </td>
              <td className={cn(ui.ecBoardMetaCell, ui.ecBoardMetaCellWide)}>
                <span className={ui.ecBoardMetaLabel}>Province/City/Municipality/Barangay:</span>{" "}
                <span className={ui.ecBoardMetaValue}>{data.address || "—"}</span>
              </td>
            </tr>
            <tr>
              <td className={cn(ui.ecBoardMetaCell, ui.ecBoardMetaCellCenter)} colSpan={2}>
                <span className={ui.ecBoardMetaLabel}>Evacuation Center/Site:</span>{" "}
                <span className="font-bold text-ph-blue">{data.ec_name || "—"}</span>
              </td>
            </tr>
            <tr>
              <td className={ui.ecBoardMetaCell} colSpan={2}>
                <div className={ui.ecBoardSummary}>
                  <span>
                    <span className={ui.ecBoardMetaLabel}>No. of Families:</span>{" "}
                    <span className={ui.ecBoardMetric}>
                      {nowOnly ? data.families_now : `${data.families_cum} / ${data.families_now}`}
                    </span>
                  </span>
                  <span>
                    <span className={ui.ecBoardMetaLabel}>No. of Persons:</span>{" "}
                    <span className={ui.ecBoardMetric}>
                      {nowOnly ? data.persons_now : `${data.persons_cum} / ${data.persons_now}`}
                    </span>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className={ui.ecBoardSection}>
        <h3 className={ui.ecBoardSectionTitle}>Age and Sex Disaggregation</h3>
        <DisaggregationTable rows={data.age_distribution} nowOnly={nowOnly} labelHeader="Age Group" />
      </section>

      <section className={ui.ecBoardSection}>
        <h3 className={ui.ecBoardSectionTitle}>Sectoral Group</h3>
        <DisaggregationTable rows={data.sectoral} nowOnly={nowOnly} labelHeader="Sectoral Group" />
      </section>
    </article>
  );
}

export function infoBoardNavItems(groups: InfoBoardGroup[]): ReportNavItem[] {
  return groups.map((group, index) => {
    const barangay = group.barangay ? formatDisplayBarangay(group.barangay) : "";
    const label = barangay ? `${group.ec_name} — ${barangay}` : group.ec_name;
    return {
      id: `${group.ec_name}-${group.address}-${index}`,
      label,
      detail: group.address || group.ec_address,
      meta: `${group.families_cum} fam · ${group.persons_cum} persons`,
    };
  });
}

export function EcInfoBoardGroups({
  groups,
  nowOnly = true,
  title,
  groupLabelPrefix = "Evacuation Center",
  emptyMessage = "No families currently listed inside evacuation centers for this filter.",
  selectedIndex = 0,
  onSelectIndex,
  showAll = false,
  onShowAllChange,
  itemNoun = "evacuation center",
}: {
  groups: InfoBoardGroup[];
  nowOnly?: boolean;
  title?: string;
  groupLabelPrefix?: string;
  emptyMessage?: string;
  selectedIndex?: number;
  onSelectIndex?: (index: number) => void;
  showAll?: boolean;
  onShowAllChange?: (showAll: boolean) => void;
  itemNoun?: string;
}) {
  const navItems = useMemo(() => infoBoardNavItems(groups), [groups]);
  const safeIndex = Math.min(Math.max(selectedIndex, 0), Math.max(groups.length - 1, 0));

  if (groups.length === 0) {
    return <div className={ui.dashboardEmpty}>{emptyMessage}</div>;
  }

  const visibleGroups = showAll ? groups : groups[safeIndex] ? [groups[safeIndex]] : [];

  return (
    <div className="space-y-6">
      {onSelectIndex && onShowAllChange && groups.length > 1 && (
        <DashboardReportNavigator
          items={navItems}
          selectedIndex={safeIndex}
          onSelectIndex={onSelectIndex}
          showAll={showAll}
          onShowAllChange={onShowAllChange}
          itemNoun={itemNoun}
        />
      )}
      <div className="space-y-8">
        {visibleGroups.map((group, index) => (
          <div key={`${group.ec_name}-${group.address ?? ""}-${safeIndex + index}`}>
            {(showAll || groups.length > 1) && (
              <div className={ui.ecInfoBoardGroupLabel}>
                <p className="text-xs font-semibold uppercase tracking-wide text-ph-blue-dark">
                  {groupLabelPrefix}
                </p>
                <p className="font-semibold text-slate-900">
                  {group.barangay ? formatDisplayBarangay(group.barangay) : group.ec_name}
                </p>
                {group.ec_address && <p className="text-sm text-slate-600">{group.ec_address}</p>}
              </div>
            )}
            <EcInfoBoardReport data={group} nowOnly={nowOnly} title={title} />
          </div>
        ))}
      </div>
    </div>
  );
}
