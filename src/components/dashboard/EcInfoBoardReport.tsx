"use client";

import type { AgeRow, InfoBoardGroup, SectoralRow } from "@/lib/dashboard-types";
import { SARANGANI_REGION } from "@/lib/sarangani-locations";

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
  const cellClass = bold ? "ec-board-td ec-board-td--metric ec-board-td--bold" : "ec-board-td ec-board-td--metric";
  if (nowOnly) {
    return (
      <>
        <td className={cellClass}>{row.male_now}</td>
        <td className={cellClass}>{row.female_now}</td>
        <td className={`${cellClass} ec-board-td--total`}>{row.total_now}</td>
      </>
    );
  }
  return (
    <>
      <td className={cellClass}>{row.male_cum}</td>
      <td className={cellClass}>{row.male_now}</td>
      <td className={cellClass}>{row.female_cum}</td>
      <td className={cellClass}>{row.female_now}</td>
      <td className={`${cellClass} ec-board-td--total`}>{row.total_cum}</td>
      <td className={`${cellClass} ec-board-td--total`}>{row.total_now}</td>
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
    <div className="ec-board-table-wrap">
      <table className="ec-board-table">
        <thead>
          <tr className="ec-board-thead-title">
            <th className="ec-board-th ec-board-th--label" rowSpan={nowOnly ? 1 : 2}>
              {labelHeader}
            </th>
            {nowOnly ? (
              <>
                <th className="ec-board-th">Male</th>
                <th className="ec-board-th">Female</th>
                <th className="ec-board-th">Total</th>
              </>
            ) : (
              <>
                <th className="ec-board-th" colSpan={2}>Male</th>
                <th className="ec-board-th" colSpan={2}>Female</th>
                <th className="ec-board-th" colSpan={2}>Total</th>
              </>
            )}
          </tr>
          {!nowOnly && (
            <tr className="ec-board-thead-sub">
              <th className="ec-board-th ec-board-th--sub">CUM</th>
              <th className="ec-board-th ec-board-th--sub">NOW</th>
              <th className="ec-board-th ec-board-th--sub">CUM</th>
              <th className="ec-board-th ec-board-th--sub">NOW</th>
              <th className="ec-board-th ec-board-th--sub">CUM</th>
              <th className="ec-board-th ec-board-th--sub">NOW</th>
            </tr>
          )}
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className={index % 2 === 0 ? "ec-board-row ec-board-row--alt" : "ec-board-row"}>
              <td className="ec-board-td ec-board-td--label">
                {isAge ? (
                  <>
                    <span className="ec-board-age-name">{(row as AgeRow).label || (row as AgeRow).group}</span>
                    {(row as AgeRow).range && (
                      <span className="ec-board-age-range">{(row as AgeRow).range}</span>
                    )}
                  </>
                ) : (
                  (row as SectoralRow).label
                )}
              </td>
              <MetricCells row={row} nowOnly={nowOnly} />
            </tr>
          ))}
          <tr className="ec-board-row ec-board-row--total">
            <td className="ec-board-td ec-board-td--label">TOTAL &gt;&gt;&gt;</td>
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
};

export default function EcInfoBoardReport({ data, nowOnly = true }: EcInfoBoardReportProps) {
  return (
    <article className="ec-info-board-report" aria-label="Evacuation Center Information Board">
      <header className="ec-board-header">
        <h2 className="ec-board-title">EVACUATION CENTER INFORMATION BOARD</h2>
        <div className="ec-board-as-of">As of {formatAsOfDate()}</div>
      </header>

      <section className="ec-board-meta">
        <table className="ec-board-meta-table">
          <tbody>
            <tr>
              <td className="ec-board-meta-cell">
                <span className="ec-board-meta-label">Region:</span>{" "}
                <span className="ec-board-meta-value">{data.region || SARANGANI_REGION}</span>
              </td>
              <td className="ec-board-meta-cell ec-board-meta-cell--wide">
                <span className="ec-board-meta-label">Province/City/Municipality/Barangay:</span>{" "}
                <span className="ec-board-meta-value">{data.address || "—"}</span>
              </td>
            </tr>
            <tr>
              <td className="ec-board-meta-cell ec-board-meta-cell--center" colSpan={2}>
                <span className="ec-board-meta-label">Evacuation Center/Site:</span>{" "}
                <span className="ec-board-ec-name">{data.ec_name || "—"}</span>
              </td>
            </tr>
            <tr>
              <td className="ec-board-meta-cell" colSpan={2}>
                <div className="ec-board-summary">
                  <span>
                    <span className="ec-board-meta-label">No. of Families:</span>{" "}
                    <span className="ec-board-metric">
                      {nowOnly ? data.families_now : `${data.families_cum} / ${data.families_now}`}
                    </span>
                  </span>
                  <span>
                    <span className="ec-board-meta-label">No. of Persons:</span>{" "}
                    <span className="ec-board-metric">
                      {nowOnly ? data.persons_now : `${data.persons_cum} / ${data.persons_now}`}
                    </span>
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ec-board-section">
        <h3 className="ec-board-section-title">Age and Sex Disaggregation</h3>
        <DisaggregationTable rows={data.age_distribution} nowOnly={nowOnly} labelHeader="Age Group" />
      </section>

      <section className="ec-board-section ec-board-section--sectoral">
        <h3 className="ec-board-section-title">Sectoral Group</h3>
        <DisaggregationTable rows={data.sectoral} nowOnly={nowOnly} labelHeader="Sectoral Group" />
      </section>
    </article>
  );
}

export function EcInfoBoardGroups({
  groups,
  nowOnly = true,
}: {
  groups: InfoBoardGroup[];
  nowOnly?: boolean;
}) {
  if (groups.length === 0) {
    return (
      <div className="dashboard-empty">
        No families currently listed inside evacuation centers for this filter.
      </div>
    );
  }

  return (
    <div className="ec-info-board-screen space-y-8">
      {groups.map((group) => (
        <div key={group.ec_name} className="ec-info-board-group">
          {groups.length > 1 && (
            <div className="ec-info-board-group-label">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ph-blue-dark)]">
                Evacuation Center
              </p>
              <p className="font-semibold text-slate-900">{group.ec_name}</p>
              {group.ec_address && <p className="text-sm text-slate-600">{group.ec_address}</p>}
            </div>
          )}
          <EcInfoBoardReport data={group} nowOnly={nowOnly} />
        </div>
      ))}
    </div>
  );
}
