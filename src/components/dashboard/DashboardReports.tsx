"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReportsBundle } from "@/lib/dashboard-types";
import { loadCityMunFilter, saveCityMunFilter } from "@/lib/dashboard-city-filter";
import { EcInfoBoardGroups } from "@/components/dashboard/EcInfoBoardReport";

type DashboardTab = "info-board" | "inside-ec" | "sex-age" | "shelter";

const TABS: { id: DashboardTab; label: string }[] = [
  { id: "info-board", label: "Evacuation Center Info Board" },
  { id: "inside-ec", label: "Inside Evacuation Centers" },
  { id: "sex-age", label: "Sex, Age & Sectoral" },
  { id: "shelter", label: "Family & Shelter" },
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

export default function DashboardReports() {
  const [cityMun, setCityMun] = useState("");
  const [bundle, setBundle] = useState<ReportsBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<DashboardTab>("info-board");
  const [nowOnly, setNowOnly] = useState(false);

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

  function handleMunicipalityChange(value: string) {
    setCityMun(value);
    saveCityMunFilter(value);
  }

  const municipalities = bundle?.municipalities ?? [];

  return (
    <div className="space-y-6">
      <div className="dashboard-filter no-print">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block min-w-[220px]">
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
          {cityMun && (
            <span className="dashboard-filter-badge">Filtered: {cityMun}</span>
          )}
        </div>
        <p className="dashboard-filter-note">
          Filter applies to all report tabs. Data comes from synced FACED records in Turso.
        </p>
      </div>

      {error && <div className="ph-alert-error">{error}</div>}

      {bundle && !loading && (
        <div className="dashboard-summary-grid no-print">
          <div className="dashboard-stat">
            <p className="dashboard-stat-label">Total families</p>
            <p className="dashboard-stat-value">{bundle.total_records}</p>
          </div>
          <div className="dashboard-stat">
            <p className="dashboard-stat-label">Inside EC</p>
            <p className="dashboard-stat-value">{bundle.inside_ec_records}</p>
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

      <div className="dashboard-toolbar no-print">
        <div className="verify-tabs" role="tablist" aria-label="Dashboard reports">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`verify-tab ${activeTab === tab.id ? "verify-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <label className="dashboard-now-toggle">
          <input type="checkbox" checked={nowOnly} onChange={(e) => setNowOnly(e.target.checked)} />
          NOW only (hide CUM columns)
        </label>
      </div>

      {loading && !bundle && <p className="text-sm text-slate-600">Loading dashboard reports…</p>}

      {bundle && activeTab === "info-board" && (
        <section>
          <h3 className="dashboard-panel-title">Evacuation Center Information Board</h3>
          <EcInfoBoardGroups groups={bundle.info_board.groups} nowOnly={nowOnly} />
        </section>
      )}

      {bundle && activeTab === "inside-ec" && (
        <section>
          <h3 className="dashboard-panel-title">Inside Evacuation Center Data</h3>
          {bundle.inside_ec.groups.length === 0 ? (
            <div className="dashboard-empty">No inside-EC families for this filter.</div>
          ) : (
            <div className="space-y-8">
              {bundle.inside_ec.groups.map((group) => (
                <div key={group.ec_name}>
                  <h4 className="dashboard-ec-label">{group.ec_name}</h4>
                  {group.ec_address && <p className="text-sm text-slate-600 mb-3">{group.ec_address}</p>}
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
  );
}
