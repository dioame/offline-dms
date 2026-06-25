"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  Home,
  MapPin,
  RefreshCw,
  Tent,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { ReportsBundle } from "@/lib/dashboard-types";
import { loadCityMunFilter, saveCityMunFilter } from "@/lib/dashboard-city-filter";
import { EcInfoBoardGroups } from "@/components/dashboard/EcInfoBoardReport";
import { SkeletonDashboard, SkeletonScreen } from "@/components/ui/Skeleton";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type DashboardTab = "info-board" | "inside-ec" | "sex-age" | "shelter";

const TABS: { id: DashboardTab; label: string; icon: LucideIcon }[] = [
  { id: "info-board", label: "Evacuation Center Info Board", icon: ClipboardList },
  { id: "inside-ec", label: "Inside Evacuation Centers", icon: Home },
  { id: "sex-age", label: "Sex, Age & Sectoral", icon: Users },
  { id: "shelter", label: "Family & Shelter", icon: Tent },
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
  if (nowOnly) return <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{now}</td>;
  return (
    <>
      <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{cum}</td>
      <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{now}</td>
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
      <div className={cn(ui.dashboardFilter, "no-print")}>
        <div className="flex flex-wrap items-end gap-4">
          <label className="block min-w-[220px]">
            <span className={ui.dashboardFilterLabel}>Municipality</span>
            <select
              value={cityMun}
              onChange={(e) => handleMunicipalityChange(e.target.value)}
              className={ui.dashboardFilterSelect}
            >
              <option value="">All municipalities</option>
              {municipalities.map((m) => (
                <option key={m.city_mun} value={m.city_mun}>
                  {m.city_mun} ({m.heads_count} families)
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className={cn(ui.headerBtn, ui.withIcon)}
            disabled={loading}
          >
            <RefreshCw className={cn(ui.iconSm, loading && "animate-spin")} aria-hidden />
            {loading ? "Loading…" : "Refresh"}
          </button>
          {cityMun && (
            <span className={ui.dashboardFilterBadge}>Filtered: {cityMun}</span>
          )}
        </div>
        <p className={ui.dashboardFilterNote}>
          Filter applies to all report tabs. Data comes from synced FACED records in Turso.
        </p>
      </div>

      {error && <div className={ui.alertError}>{error}</div>}

      {bundle && !loading && (
        <div className={cn(ui.dashboardSummaryGrid, "no-print")}>
          <div className={ui.dashboardStat}>
            <p className={cn(ui.dashboardStatLabel, ui.withIcon)}>
              <Users className={ui.iconSm} aria-hidden />
              Total families
            </p>
            <p className={ui.dashboardStatValue}>{bundle.total_records}</p>
          </div>
          <div className={ui.dashboardStat}>
            <p className={cn(ui.dashboardStatLabel, ui.withIcon)}>
              <Home className={ui.iconSm} aria-hidden />
              Inside EC
            </p>
            <p className={ui.dashboardStatValue}>{bundle.inside_ec_records}</p>
          </div>
          <div className={ui.dashboardStat}>
            <p className={cn(ui.dashboardStatLabel, ui.withIcon)}>
              <MapPin className={ui.iconSm} aria-hidden />
              EC sites
            </p>
            <p className={ui.dashboardStatValue}>{bundle.inside_ec.ec_sites_count}</p>
          </div>
          <div className={ui.dashboardStat}>
            <p className={cn(ui.dashboardStatLabel, ui.withIcon)}>
              <UserRound className={ui.iconSm} aria-hidden />
              Persons (encoded)
            </p>
            <p className={ui.dashboardStatValue}>{bundle.sex_age_sectoral.totals.total_cum}</p>
          </div>
        </div>
      )}

      <div className={cn(ui.dashboardToolbar, "no-print")}>
        <div className={ui.verifyTabs} role="tablist" aria-label="Dashboard reports">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cn(ui.verifyTabClass(activeTab === tab.id), ui.withIcon)}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon className={ui.iconSm} aria-hidden />
              {tab.label}
            </button>
          ))}
        </div>
        <label className={ui.dashboardNowToggle}>
          <input type="checkbox" checked={nowOnly} onChange={(e) => setNowOnly(e.target.checked)} />
          NOW only (hide CUM columns)
        </label>
      </div>

      {loading && !bundle && (
        <SkeletonScreen label="Loading dashboard reports">
          <SkeletonDashboard />
        </SkeletonScreen>
      )}

      {bundle && activeTab === "info-board" && (
        <section>
          <h3 className={ui.dashboardPanelTitle}>Evacuation Center Information Board</h3>
          <EcInfoBoardGroups groups={bundle.info_board.groups} nowOnly={nowOnly} />
        </section>
      )}

      {bundle && activeTab === "inside-ec" && (
        <section>
          <h3 className={ui.dashboardPanelTitle}>Inside Evacuation Center Data</h3>
          {bundle.inside_ec.groups.length === 0 ? (
            <div className={ui.dashboardEmpty}>No inside-EC families for this filter.</div>
          ) : (
            <div className="space-y-8">
              {bundle.inside_ec.groups.map((group) => (
                <div key={group.ec_name}>
                  <h4 className={ui.dashboardEcLabel}>{group.ec_name}</h4>
                  {group.ec_address && <p className="text-sm text-slate-600 mb-3">{group.ec_address}</p>}
                  <div className={ui.ecBoardTableWrap}>
                    <table className={ui.ecBoardTable}>
                      <thead>
                        <tr>
                          <th className={cn(ui.ecBoardTh, ui.ecBoardThLabel)} rowSpan={nowOnly ? 1 : 2}>
                            Barangay of Origin
                          </th>
                          <th className={ui.ecBoardTh} colSpan={nowOnly ? 1 : 2}>
                            No. of Families
                          </th>
                          <th className={ui.ecBoardTh} colSpan={nowOnly ? 1 : 2}>
                            No. of Persons
                          </th>
                        </tr>
                        {!nowOnly && (
                          <tr className="ec-board-thead-sub">
                            <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>CUM</th>
                            <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>NOW</th>
                            <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>CUM</th>
                            <th className={cn(ui.ecBoardTh, ui.ecBoardThSub)}>NOW</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {group.by_barangay.map((row, index) => (
                          <tr
                            key={row.barangay}
                            className={index % 2 === 0 ? ui.ecBoardRowAlt : undefined}
                          >
                            <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>{row.barangay}</td>
                            <CumNowCells cum={row.families_cum} now={row.families_now} nowOnly={nowOnly} />
                            <CumNowCells cum={row.persons_cum} now={row.persons_now} nowOnly={nowOnly} />
                          </tr>
                        ))}
                        <tr className={ui.ecBoardRowTotal}>
                          <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>TOTAL</td>
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
            <h3 className={ui.dashboardPanelTitle}>Sex &amp; Age Distribution — Encoded Records</h3>
            {bundle.sex_age_sectoral.totals.total_cum === 0 ? (
              <div className={ui.dashboardEmpty}>No encoded records for this filter.</div>
            ) : (
              <div className={ui.ecBoardTableWrap}>
                <table className={ui.ecBoardTable}>
                  <thead>
                    <tr>
                      <th className={cn(ui.ecBoardTh, ui.ecBoardThLabel)} rowSpan={nowOnly ? 1 : 2}>
                        Age Group
                      </th>
                      <th className={ui.ecBoardTh} colSpan={nowOnly ? 1 : 2}>Male</th>
                      <th className={ui.ecBoardTh} colSpan={nowOnly ? 1 : 2}>Female</th>
                      <th className={ui.ecBoardTh} colSpan={nowOnly ? 1 : 2}>Total</th>
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
                    {bundle.sex_age_sectoral.age_distribution.map((row, index) => (
                      <tr
                        key={row.group}
                        className={index % 2 === 0 ? ui.ecBoardRowAlt : undefined}
                      >
                        <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>
                          <span className={ui.ecBoardAgeName}>{row.label}</span>
                          <span className={ui.ecBoardAgeRange}>{row.range}</span>
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
            <h3 className={ui.dashboardPanelTitle}>Sectoral Data</h3>
            <div className={ui.ecBoardTableWrap}>
              <table className={ui.ecBoardTable}>
                <thead>
                  <tr>
                    <th className={cn(ui.ecBoardTh, ui.ecBoardThLabel)} rowSpan={nowOnly ? 1 : 2}>
                      Sectoral Group
                    </th>
                    <th className={ui.ecBoardTh} colSpan={nowOnly ? 1 : 2}>Male</th>
                    <th className={ui.ecBoardTh} colSpan={nowOnly ? 1 : 2}>Female</th>
                    <th className={ui.ecBoardTh} colSpan={nowOnly ? 1 : 2}>Total</th>
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
                  {bundle.sex_age_sectoral.sectoral.map((row, index) => (
                    <tr
                      key={row.label}
                      className={index % 2 === 0 ? ui.ecBoardRowAlt : undefined}
                    >
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>{row.label}</td>
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
          <h3 className={ui.dashboardPanelTitle}>Family &amp; Shelter</h3>
          <div className={ui.dashboardShelterGrid}>
            <div>
              <h4 className={ui.dashboardSubtitle}>Shelter Damage Classification</h4>
              <div className={ui.ecBoardTableWrap}>
                <table className={ui.ecBoardTable}>
                  <thead>
                    <tr>
                      <th className={cn(ui.ecBoardTh, ui.ecBoardThLabel)}>Classification</th>
                      <th className={ui.ecBoardTh}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={ui.ecBoardRowAlt}>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>Totally Damaged</td>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{bundle.shelter.damage.totally}</td>
                    </tr>
                    <tr>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>Partially Damaged</td>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{bundle.shelter.damage.partially}</td>
                    </tr>
                    <tr className={ui.ecBoardRowAlt}>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>Not Identified</td>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{bundle.shelter.damage.not_identified}</td>
                    </tr>
                    <tr className={ui.ecBoardRowTotal}>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>TOTAL</td>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{bundle.shelter.damage.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className={ui.dashboardSubtitle}>House Ownership Type</h4>
              <div className={ui.ecBoardTableWrap}>
                <table className={ui.ecBoardTable}>
                  <thead>
                    <tr>
                      <th className={cn(ui.ecBoardTh, ui.ecBoardThLabel)}>Type</th>
                      <th className={ui.ecBoardTh}>Count</th>
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
                        className={index % 2 === 0 ? ui.ecBoardRowAlt : undefined}
                      >
                        <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>{label}</td>
                        <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{count}</td>
                      </tr>
                    ))}
                    <tr className={ui.ecBoardRowTotal}>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdLabel)}>TOTAL</td>
                      <td className={cn(ui.ecBoardTd, ui.ecBoardTdMetric)}>{bundle.shelter.ownership.total}</td>
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
