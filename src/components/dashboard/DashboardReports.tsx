"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { InsideEcGroup, ReportsBundle } from "@/lib/dashboard-types";
import { loadCityMunFilter, saveCityMunFilter } from "@/lib/dashboard-city-filter";
import DashboardReportNavigator, { type ReportNavItem } from "@/components/dashboard/DashboardReportNavigator";
import EcInfoBoardReport, { EcInfoBoardGroups } from "@/components/dashboard/EcInfoBoardReport";

type DashboardTab = "info-board" | "inside-ec" | "outside-ec" | "sex-age" | "shelter";

const TABS: { id: DashboardTab; label: string; shortLabel: string }[] = [
  { id: "info-board", label: "Evacuation Center Info Board", shortLabel: "EC Info Board" },
  { id: "inside-ec", label: "Inside Evacuation Centers", shortLabel: "Inside EC" },
  { id: "outside-ec", label: "Outside Evacuation Centers", shortLabel: "Outside EC" },
  { id: "sex-age", label: "Sex, Age & Sectoral", shortLabel: "Sex / Age" },
  { id: "shelter", label: "Family & Shelter", shortLabel: "Shelter" },
];

function CumNowCells({
  cum,
  now,
  nowOnly,
}: {
  cum: number;
  now: number;
  nowOnly?: boolean;
}) {
  if (nowOnly) return <td className="ec-board-td ec-board-td--metric">{now}</td>;
  return (
    <>
      <td className="ec-board-td ec-board-td--metric">{cum}</td>
      <td className="ec-board-td ec-board-td--metric">{now}</td>
    </>
  );
}

function insideEcNavItems(groups: InsideEcGroup[]): ReportNavItem[] {
  return groups.map((group, index) => ({
    id: `${group.ec_name}-${index}`,
    label: group.ec_name,
    detail: group.ec_address,
    meta: `${group.totals.families_cum} fam · ${group.totals.persons_cum} persons`,
  }));
}

export default function DashboardReports() {
  const reportPaneRef = useRef<HTMLDivElement>(null);
  const [cityMun, setCityMun] = useState("");
  const [bundle, setBundle] = useState<ReportsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("info-board");
  const [nowOnly, setNowOnly] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [infoBoardIndex, setInfoBoardIndex] = useState(0);
  const [insideEcIndex, setInsideEcIndex] = useState(0);
  const [outsideBrgyIndex, setOutsideBrgyIndex] = useState(0);
  const [showAllBoards, setShowAllBoards] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (cityMun.trim()) params.set("city_mun", cityMun.trim());
      const res = await fetch(`/api/dashboard?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard.");
      setBundle(data as ReportsBundle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [cityMun]);

  useEffect(() => {
    setCityMun(loadCityMunFilter());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setInfoBoardIndex(0);
    setInsideEcIndex(0);
    setOutsideBrgyIndex(0);
    setShowAllBoards(false);
  }, [cityMun]);

  useEffect(() => {
    setShowAllBoards(false);
  }, [activeTab]);

  useEffect(() => {
    reportPaneRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [infoBoardIndex, insideEcIndex, outsideBrgyIndex, showAllBoards]);

  function handleMunicipalityChange(value: string) {
    setCityMun(value);
    saveCityMunFilter(value);
  }

  const municipalities = bundle?.municipalities ?? [];
  const insideEcGroups = bundle?.inside_ec.groups ?? [];
  const insideEcSafeIndex = Math.min(
    insideEcIndex,
    Math.max(insideEcGroups.length - 1, 0),
  );
  const infoBoardGroups = bundle?.info_board.groups ?? [];
  const infoBoardSafeIndex = Math.min(
    infoBoardIndex,
    Math.max(infoBoardGroups.length - 1, 0),
  );
  const outsideBrgyGroups = bundle?.outside_ec.barangay_groups ?? [];
  const outsideBrgySafeIndex = Math.min(
    outsideBrgyIndex,
    Math.max(outsideBrgyGroups.length - 1, 0),
  );
  const visibleInsideEcGroups = showAllBoards
    ? insideEcGroups
    : insideEcGroups[insideEcSafeIndex]
      ? [insideEcGroups[insideEcSafeIndex]]
      : [];

  return (
    <div className="dashboard-shell space-y-4">
      {controlsOpen && (
        <div className="dashboard-controls no-print space-y-4">
          <div className="dashboard-filter">
            <div className="flex flex-wrap items-end gap-4">
              <label className="block min-w-[220px] flex-1">
                <span className="dashboard-filter-label">Municipality</span>
                <select
                  value={cityMun}
                  onChange={(e) => handleMunicipalityChange(e.target.value)}
                  className="dashboard-filter-select"
                >
                  <option value="">All municipalities</option>
                  {municipalities.map((m) => (
                    <option key={m.city_mun} value={m.city_mun}>
                      {m.city_mun} ({m.heads_count} families)
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => void load()} className="ph-header-btn" disabled={loading}>
                {loading ? "Loading…" : "Refresh"}
              </button>
              {cityMun && <span className="dashboard-filter-badge">Filtered: {cityMun}</span>}
            </div>
            <details className="dashboard-filter-details">
              <summary>Classification notes</summary>
              <p className="dashboard-filter-note">
                Families are tagged <strong>Outside EC</strong> when the evacuation site is blank,
                contains &quot;Outside EC&quot;, or is listed as Tuyan. Inside-EC reports use named
                evacuation sites only.
              </p>
            </details>
          </div>

          {bundle && !loading && (
            <div className="dashboard-summary-grid">
              <div className="dashboard-stat">
                <p className="dashboard-stat-label">Total families</p>
                <p className="dashboard-stat-value">{bundle.total_records}</p>
              </div>
              <div className="dashboard-stat">
                <p className="dashboard-stat-label">Inside EC</p>
                <p className="dashboard-stat-value">{bundle.inside_ec_records}</p>
              </div>
              <div className="dashboard-stat dashboard-stat--outside">
                <p className="dashboard-stat-label">Outside EC</p>
                <p className="dashboard-stat-value">{bundle.outside_ec_records}</p>
                <p className="dashboard-stat-sub">
                  {bundle.outside_ec.totals.persons_cum.toLocaleString()} persons
                </p>
              </div>
              <div className="dashboard-stat">
                <p className="dashboard-stat-label">EC sites</p>
                <p className="dashboard-stat-value">{bundle.inside_ec.ec_sites_count}</p>
              </div>
              <div className="dashboard-stat">
                <p className="dashboard-stat-label">Persons (encoded)</p>
                <p className="dashboard-stat-value">{bundle.sex_age_sectoral.totals.total_cum}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div className="ph-alert-error">{error}</div>}

      <div className="dashboard-sticky-bar no-print">
        <div className="dashboard-sticky-bar-row">
          <button
            type="button"
            className="dashboard-controls-toggle"
            onClick={() => setControlsOpen((open) => !open)}
            aria-expanded={controlsOpen}
          >
            {controlsOpen ? "Hide filters" : "Show filters"}
          </button>
          <label className="dashboard-report-select-wrap">
            <span className="dashboard-report-select-label">Report</span>
            <select
              className="dashboard-report-select"
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as DashboardTab)}
              aria-label="Select dashboard report"
            >
              {TABS.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </label>
          <label className="dashboard-now-toggle">
            <input type="checkbox" checked={nowOnly} onChange={(e) => setNowOnly(e.target.checked)} />
            NOW only
          </label>
        </div>
        <div className="dashboard-report-tabs" role="tablist" aria-label="Dashboard reports">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              title={tab.label}
              className={`dashboard-report-tab ${activeTab === tab.id ? "dashboard-report-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.shortLabel}
            </button>
          ))}
        </div>
      </div>

      <div ref={reportPaneRef} className="dashboard-report-pane">

      {loading && !bundle && <p className="text-sm text-slate-600">Loading dashboard reports…</p>}

      {bundle && activeTab === "info-board" && (
        <section>
          <h3 className="dashboard-panel-title">
            Evacuation Center Information Board
            {bundle.info_board.groups.length > 1 && !showAllBoards && (
              <span className="dashboard-panel-meta">
                {" "}
                — {infoBoardSafeIndex + 1} of {bundle.info_board.groups.length}
              </span>
            )}
          </h3>
          <EcInfoBoardGroups
            groups={bundle.info_board.groups}
            nowOnly={nowOnly}
            selectedIndex={infoBoardSafeIndex}
            onSelectIndex={setInfoBoardIndex}
            showAll={showAllBoards}
            onShowAllChange={setShowAllBoards}
          />
        </section>
      )}

      {bundle && activeTab === "inside-ec" && (
        <section>
          <h3 className="dashboard-panel-title">
            Inside Evacuation Center Data
            {insideEcGroups.length > 1 && !showAllBoards && (
              <span className="dashboard-panel-meta">
                {" "}
                — {insideEcSafeIndex + 1} of {insideEcGroups.length}
              </span>
            )}
          </h3>
          {insideEcGroups.length === 0 ? (
            <div className="dashboard-empty">No inside-EC families for this filter.</div>
          ) : (
            <>
              <DashboardReportNavigator
                items={insideEcNavItems(insideEcGroups)}
                selectedIndex={insideEcSafeIndex}
                onSelectIndex={setInsideEcIndex}
                showAll={showAllBoards}
                onShowAllChange={setShowAllBoards}
                itemNoun="evacuation center"
              />
              <div className={showAllBoards ? "space-y-8" : undefined}>
                {visibleInsideEcGroups.map((group) => (
                  <div key={group.ec_name}>
                    {showAllBoards && (
                      <>
                        <h4 className="dashboard-ec-label">{group.ec_name}</h4>
                        {group.ec_address && <p className="mb-3 text-sm text-slate-600">{group.ec_address}</p>}
                      </>
                    )}
                    <div className="ec-board-table-wrap">
                      <table className="ec-board-table">
                      <thead>
                        <tr>
                          <th className="ec-board-th ec-board-th--label" rowSpan={nowOnly ? 1 : 2}>
                            Barangay of Origin
                          </th>
                          <th className="ec-board-th" colSpan={nowOnly ? 1 : 2}>
                            No. of Families
                          </th>
                          <th className="ec-board-th" colSpan={nowOnly ? 1 : 2}>
                            No. of Persons
                          </th>
                        </tr>
                        {!nowOnly && (
                          <tr className="ec-board-thead-sub">
                            <th className="ec-board-th ec-board-th--sub">CUM</th>
                            <th className="ec-board-th ec-board-th--sub">NOW</th>
                            <th className="ec-board-th ec-board-th--sub">CUM</th>
                            <th className="ec-board-th ec-board-th--sub">NOW</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {group.by_barangay.map((row, index) => (
                          <tr
                            key={row.barangay}
                            className={index % 2 === 0 ? "ec-board-row ec-board-row--alt" : "ec-board-row"}
                          >
                            <td className="ec-board-td ec-board-td--label">{row.barangay}</td>
                            <CumNowCells cum={row.families_cum} now={row.families_now} nowOnly={nowOnly} />
                            <CumNowCells cum={row.persons_cum} now={row.persons_now} nowOnly={nowOnly} />
                          </tr>
                        ))}
                        <tr className="ec-board-row ec-board-row--total">
                          <td className="ec-board-td ec-board-td--label">TOTAL</td>
                          <CumNowCells
                            cum={group.totals.families_cum}
                            now={group.totals.families_now}
                            nowOnly={nowOnly}
                          />
                          <CumNowCells
                            cum={group.totals.persons_cum}
                            now={group.totals.persons_now}
                            nowOnly={nowOnly}
                          />
                        </tr>
                      </tbody>
                    </table>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {bundle && activeTab === "outside-ec" && (
        <section className="space-y-8">
          <div className="dashboard-summary-grid dashboard-summary-grid--section">
            <div className="dashboard-stat dashboard-stat--outside">
              <p className="dashboard-stat-label">Outside EC families</p>
              <p className="dashboard-stat-value">{bundle.outside_ec.totals.families_cum}</p>
            </div>
            <div className="dashboard-stat dashboard-stat--outside">
              <p className="dashboard-stat-label">Outside EC persons</p>
              <p className="dashboard-stat-value">{bundle.outside_ec.totals.persons_cum}</p>
            </div>
            <div className="dashboard-stat dashboard-stat--outside">
              <p className="dashboard-stat-label">Barangays</p>
              <p className="dashboard-stat-value">{bundle.outside_ec.by_barangay.length}</p>
            </div>
          </div>

          {bundle.outside_ec.totals.families_cum === 0 ? (
            <div className="dashboard-empty">No outside-EC families for this filter.</div>
          ) : (
            <>
              <div>
                <h3 className="dashboard-panel-title">Outside EC — Summary</h3>
                <p className="mb-4 text-sm text-slate-600">
                  Families not in an evacuation center (blank site, &quot;Outside EC&quot;, Tuyan, or
                  evacuation status &quot;no&quot;), with age/sex and sectoral disaggregation.
                </p>
                <EcInfoBoardReport
                  data={bundle.outside_ec.summary_board}
                  nowOnly={nowOnly}
                  title="OUTSIDE EVACUATION CENTER INFORMATION BOARD"
                />
              </div>

              {bundle.outside_ec.barangay_groups.length > 0 && (
                <div>
                  <h3 className="dashboard-panel-title">
                    Outside EC — by Barangay
                    {bundle.outside_ec.barangay_groups.length > 1 && !showAllBoards && (
                      <span className="dashboard-panel-meta">
                        {" "}
                        — {outsideBrgySafeIndex + 1} of {bundle.outside_ec.barangay_groups.length}
                      </span>
                    )}
                  </h3>
                  <EcInfoBoardGroups
                    groups={bundle.outside_ec.barangay_groups}
                    nowOnly={nowOnly}
                    title="OUTSIDE EVACUATION CENTER INFORMATION BOARD"
                    groupLabelPrefix="Barangay"
                    emptyMessage="No outside-EC families for this filter."
                    selectedIndex={outsideBrgySafeIndex}
                    onSelectIndex={setOutsideBrgyIndex}
                    showAll={showAllBoards}
                    onShowAllChange={setShowAllBoards}
                    itemNoun="barangay"
                  />
                </div>
              )}

              <div>
                <h3 className="dashboard-panel-title">Shelter damage — by Barangay</h3>
                <div className="ec-board-table-wrap">
                  <table className="ec-board-table">
                    <thead>
                      <tr>
                        <th className="ec-board-th ec-board-th--label">Barangay</th>
                        <th className="ec-board-th">Family Heads</th>
                        <th className="ec-board-th">Total Persons</th>
                        <th className="ec-board-th">Totally</th>
                        <th className="ec-board-th">Partially</th>
                        <th className="ec-board-th">Not Identified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundle.outside_ec.by_barangay.map((row, index) => (
                        <tr
                          key={row.barangay}
                          className={index % 2 === 0 ? "ec-board-row ec-board-row--alt" : "ec-board-row"}
                        >
                          <td className="ec-board-td ec-board-td--label">{row.barangay}</td>
                          <td className="ec-board-td ec-board-td--metric">{row.families_cum}</td>
                          <td className="ec-board-td ec-board-td--metric">{row.persons_cum}</td>
                          <td className="ec-board-td ec-board-td--metric">{row.shelter?.totally ?? 0}</td>
                          <td className="ec-board-td ec-board-td--metric">{row.shelter?.partially ?? 0}</td>
                          <td className="ec-board-td ec-board-td--metric">
                            {row.shelter?.not_identified ?? 0}
                          </td>
                        </tr>
                      ))}
                      <tr className="ec-board-row ec-board-row--total">
                        <td className="ec-board-td ec-board-td--label">TOTAL</td>
                        <td className="ec-board-td ec-board-td--metric">{bundle.outside_ec.totals.families_cum}</td>
                        <td className="ec-board-td ec-board-td--metric">{bundle.outside_ec.totals.persons_cum}</td>
                        <td className="ec-board-td ec-board-td--metric">
                          {bundle.outside_ec.totals.shelter?.totally ?? 0}
                        </td>
                        <td className="ec-board-td ec-board-td--metric">
                          {bundle.outside_ec.totals.shelter?.partially ?? 0}
                        </td>
                        <td className="ec-board-td ec-board-td--metric">
                          {bundle.outside_ec.totals.shelter?.not_identified ?? 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {bundle && activeTab === "sex-age" && (
        <section className="space-y-8">
          <div>
            <h3 className="dashboard-panel-title">Sex &amp; Age Distribution — Encoded Records</h3>
            {bundle.sex_age_sectoral.totals.total_cum === 0 ? (
              <div className="dashboard-empty">No encoded records for this filter.</div>
            ) : (
              <div className="ec-board-table-wrap">
                <table className="ec-board-table">
                  <thead>
                    <tr>
                      <th className="ec-board-th ec-board-th--label" rowSpan={nowOnly ? 1 : 2}>
                        Age Group
                      </th>
                      <th className="ec-board-th" colSpan={nowOnly ? 1 : 2}>Male</th>
                      <th className="ec-board-th" colSpan={nowOnly ? 1 : 2}>Female</th>
                      <th className="ec-board-th" colSpan={nowOnly ? 1 : 2}>Total</th>
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
                    {bundle.sex_age_sectoral.age_distribution.map((row, index) => (
                      <tr
                        key={row.group}
                        className={index % 2 === 0 ? "ec-board-row ec-board-row--alt" : "ec-board-row"}
                      >
                        <td className="ec-board-td ec-board-td--label">
                          <span className="ec-board-age-name">{row.label}</span>
                          <span className="ec-board-age-range">{row.range}</span>
                        </td>
                        <CumNowCells cum={row.male_cum} now={row.male_now} nowOnly={nowOnly} />
                        <CumNowCells cum={row.female_cum} now={row.female_now} nowOnly={nowOnly} />
                        <CumNowCells cum={row.total_cum} now={row.total_now} nowOnly={nowOnly} />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="dashboard-panel-title">Sectoral Data</h3>
            <div className="ec-board-table-wrap">
              <table className="ec-board-table">
                <thead>
                  <tr>
                    <th className="ec-board-th ec-board-th--label" rowSpan={nowOnly ? 1 : 2}>
                      Sectoral Group
                    </th>
                    <th className="ec-board-th" colSpan={nowOnly ? 1 : 2}>Male</th>
                    <th className="ec-board-th" colSpan={nowOnly ? 1 : 2}>Female</th>
                    <th className="ec-board-th" colSpan={nowOnly ? 1 : 2}>Total</th>
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
                  {bundle.sex_age_sectoral.sectoral.map((row, index) => (
                    <tr
                      key={row.label}
                      className={index % 2 === 0 ? "ec-board-row ec-board-row--alt" : "ec-board-row"}
                    >
                      <td className="ec-board-td ec-board-td--label">{row.label}</td>
                      <CumNowCells cum={row.male_cum} now={row.male_now} nowOnly={nowOnly} />
                      <CumNowCells cum={row.female_cum} now={row.female_now} nowOnly={nowOnly} />
                      <CumNowCells cum={row.total_cum} now={row.total_now} nowOnly={nowOnly} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {bundle && activeTab === "shelter" && (
        <section>
          <h3 className="dashboard-panel-title">Family &amp; Shelter</h3>
          <div className="dashboard-shelter-grid">
            <div>
              <h4 className="dashboard-subtitle">Shelter Damage Classification</h4>
              <div className="ec-board-table-wrap">
                <table className="ec-board-table">
                  <thead>
                    <tr>
                      <th className="ec-board-th ec-board-th--label">Classification</th>
                      <th className="ec-board-th">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="ec-board-row ec-board-row--alt">
                      <td className="ec-board-td ec-board-td--label">Totally Damaged</td>
                      <td className="ec-board-td ec-board-td--metric">{bundle.shelter.damage.totally}</td>
                    </tr>
                    <tr className="ec-board-row">
                      <td className="ec-board-td ec-board-td--label">Partially Damaged</td>
                      <td className="ec-board-td ec-board-td--metric">{bundle.shelter.damage.partially}</td>
                    </tr>
                    <tr className="ec-board-row ec-board-row--alt">
                      <td className="ec-board-td ec-board-td--label">Not Identified</td>
                      <td className="ec-board-td ec-board-td--metric">{bundle.shelter.damage.not_identified}</td>
                    </tr>
                    <tr className="ec-board-row ec-board-row--total">
                      <td className="ec-board-td ec-board-td--label">TOTAL</td>
                      <td className="ec-board-td ec-board-td--metric">{bundle.shelter.damage.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="dashboard-subtitle">House Ownership Type</h4>
              <div className="ec-board-table-wrap">
                <table className="ec-board-table">
                  <thead>
                    <tr>
                      <th className="ec-board-th ec-board-th--label">Type</th>
                      <th className="ec-board-th">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(
                      [
                        ["Owner", bundle.shelter.ownership.owner],
                        ["Renter", bundle.shelter.ownership.renter],
                        ["Sharer", bundle.shelter.ownership.sharer],
                        ["Not Identified", bundle.shelter.ownership.not_identified],
                      ] as const
                    ).map(([label, count], index) => (
                      <tr
                        key={label}
                        className={index % 2 === 0 ? "ec-board-row ec-board-row--alt" : "ec-board-row"}
                      >
                        <td className="ec-board-td ec-board-td--label">{label}</td>
                        <td className="ec-board-td ec-board-td--metric">{count}</td>
                      </tr>
                    ))}
                    <tr className="ec-board-row ec-board-row--total">
                      <td className="ec-board-td ec-board-td--label">TOTAL</td>
                      <td className="ec-board-td ec-board-td--metric">{bundle.shelter.ownership.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}
