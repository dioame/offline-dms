"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Download,
  Loader2,
  Lock,
  RefreshCw,
  Users,
} from "lucide-react";
import {
  exportSurveyResponsesToExcel,
  type SurveyExportRow,
} from "@/lib/export-excel";
import {
  surveyPayloadToExportRow,
  type SurveyAnalytics,
  type SurveyResponseRow,
} from "@/lib/survey-types";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";
import { SkeletonScreen, SkeletonStatGrid, SkeletonTable } from "@/components/ui/Skeleton";

const ADMIN_STORAGE_KEY = "dms_admin_password";

type SurveyAnalyticsPanelProps = {
  password: string;
  unlocked: boolean;
  onUnlock: (password: string) => void;
};

function formatAvg(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toFixed(2);
}

export default function SurveyAnalyticsPanel({
  password,
  unlocked,
  onUnlock,
}: SurveyAnalyticsPanelProps) {
  const [localPassword, setLocalPassword] = useState(password);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);

  const adminFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const stored = sessionStorage.getItem(ADMIN_STORAGE_KEY) || localPassword;
      return fetch(path, {
        ...init,
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": stored,
          ...init?.headers,
        },
      });
    },
    [localPassword],
  );

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminFetch("/api/survey/analytics");
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          sessionStorage.removeItem(ADMIN_STORAGE_KEY);
          throw new Error("Invalid admin password.");
        }
        throw new Error(data.error || "Failed to load analytics.");
      }
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics.");
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [adminFetch]);

  useEffect(() => {
    if (unlocked) {
      void loadAnalytics();
    }
  }, [unlocked, loadAnalytics]);

  async function handleUnlock(event: React.FormEvent) {
    event.preventDefault();
    sessionStorage.setItem(ADMIN_STORAGE_KEY, localPassword);
    onUnlock(localPassword);
  }

  async function handleExportExcel() {
    setExporting(true);
    setError("");
    try {
      const res = await adminFetch("/api/survey?limit=5000");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to export responses.");
      }

      const rows: SurveyExportRow[] = (data.responses as SurveyResponseRow[]).map(
        surveyPayloadToExportRow,
      );

      const date = new Date().toISOString().slice(0, 10);
      exportSurveyResponsesToExcel(rows, `Offline_Online_Faced_App_Survey_${date}.xlsx`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }

  if (!unlocked) {
    return (
      <div className={ui.card}>
        <div className="space-y-4 p-6">
          <div className={cn(ui.withIcon, "font-semibold text-ph-blue-dark")}>
            <Lock className={ui.iconMd} aria-hidden />
            Admin access required
          </div>
          <p className="text-sm text-gray-600">
            Enter the admin password to view analytics and export raw responses to
            Excel.
          </p>
          <form onSubmit={(e) => void handleUnlock(e)} className="flex flex-wrap gap-3">
            <input
              type="password"
              value={localPassword}
              onChange={(e) => setLocalPassword(e.target.value)}
              className={cn(ui.input, "max-w-xs")}
              placeholder="Admin password"
              required
            />
            <button type="submit" className={ui.btnPrimary}>
              Unlock analytics
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading && !analytics) {
    return (
      <SkeletonScreen>
        <SkeletonStatGrid count={4} />
        <SkeletonTable rows={6} />
      </SkeletonScreen>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">
          Offline/Online Faced App evaluation summary. Export Excel for raw response data.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className={cn(ui.btnSecondary, ui.withIcon)}
          >
            {loading ? (
              <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
            ) : (
              <RefreshCw className={ui.iconSm} aria-hidden />
            )}
            Refresh
          </button>
          <button
            type="button"
            onClick={() => void handleExportExcel()}
            disabled={exporting}
            className={cn(ui.btnPrimary, ui.withIcon)}
          >
            {exporting ? (
              <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
            ) : (
              <Download className={ui.iconSm} aria-hidden />
            )}
            Export Excel (raw)
          </button>
        </div>
      </div>

      {error ? <div className={ui.alertError}>{error}</div> : null}

      {analytics ? (
        <>
          <div className={ui.dashboardSummaryGrid}>
            <div className={ui.dashboardStat}>
              <Users className={ui.iconMd} aria-hidden />
              <p className={ui.dashboardStatValue}>{analytics.total_responses}</p>
              <p className="text-sm font-medium text-gray-600">Total responses</p>
            </div>
            <div className={ui.dashboardStat}>
              <BarChart3 className={ui.iconMd} aria-hidden />
              <p className={ui.dashboardStatValue}>
                {formatAvg(analytics.overall_stars_average)}
              </p>
              <p className="text-sm font-medium text-gray-600">Avg. overall stars</p>
            </div>
            <div className={ui.dashboardStat}>
              <p className={ui.dashboardStatValue}>{analytics.informed.yes}</p>
              <p className="text-sm font-medium text-gray-600">Informed (Yes)</p>
            </div>
            <div className={ui.dashboardStat}>
              <p className={ui.dashboardStatValue}>{analytics.informed.no}</p>
              <p className="text-sm font-medium text-gray-600">Not informed (No)</p>
            </div>
          </div>

          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h3 className="font-bold text-ph-blue-dark">
                Part II — Evaluation averages (1–5)
              </h3>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[28rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-ph-blue-dark">
                    <th className="py-2 pr-4">Statement</th>
                    <th className="py-2">Average</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(analytics.evaluation_averages).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{label}</td>
                      <td className="py-2 font-semibold">{formatAvg(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h3 className="font-bold text-ph-blue-dark">
                Part IV — Sustainability averages (1–5)
              </h3>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[28rem] text-sm">
                <tbody>
                  {Object.entries(analytics.sustainability_averages).map(([label, value]) => (
                    <tr key={label} className="border-b border-gray-100">
                      <td className="py-2 pr-4">{label}</td>
                      <td className="py-2 font-semibold">{formatAvg(value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h3 className="font-bold text-ph-blue-dark">Overall rating breakdown</h3>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
              {analytics.overall_rating.map(({ label, count }) => (
                <div
                  key={label}
                  className="rounded-lg border border-gray-200 p-3 text-center"
                >
                  <p className="text-2xl font-bold text-ph-blue-dark">{count}</p>
                  <p className="text-sm text-gray-600">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h3 className="font-bold text-ph-blue-dark">Work improvement</h3>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2">
              {analytics.work_improvement.map(({ label, count }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2 text-sm"
                >
                  <span>{label}</span>
                  <span className="font-bold text-ph-blue-dark">{count}</span>
                </div>
              ))}
            </div>
          </section>

          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h3 className="font-bold text-ph-blue-dark">Benefits reported</h3>
            </div>
            <div className="grid gap-2 p-4 sm:grid-cols-2">
              {analytics.benefit_counts.map(({ label, count }) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2 text-sm"
                >
                  <span>{label}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </section>

          {analytics.by_region.length > 0 ? (
            <section className={ui.card}>
              <div className={ui.cardHeader}>
                <h3 className="font-bold text-ph-blue-dark">By region/field office</h3>
              </div>
              <div className="overflow-x-auto p-4">
                <table className="w-full text-sm">
                  <tbody>
                    {analytics.by_region.map((row) => (
                      <tr key={row.region_field_office} className="border-b border-gray-100">
                        <td className="py-2 pr-4">{row.region_field_office}</td>
                        <td className="py-2">{row.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className={ui.card}>
            <div className={ui.cardHeader}>
              <h3 className="font-bold text-ph-blue-dark">Recent responses</h3>
            </div>
            <div className="overflow-x-auto p-4">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b text-left text-ph-blue-dark">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Office</th>
                    <th className="py-2 pr-3">Region</th>
                    <th className="py-2 pr-3">Stars</th>
                    <th className="py-2">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.recent.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-gray-500">
                        No responses yet.
                      </td>
                    </tr>
                  ) : (
                    analytics.recent.map((row) => (
                      <tr key={row.id} className="border-b border-gray-100">
                        <td className="py-2 pr-3">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 pr-3">{row.name || "—"}</td>
                        <td className="py-2 pr-3">{row.payload.office_division}</td>
                        <td className="py-2 pr-3">{row.region_field_office}</td>
                        <td className="py-2 pr-3">{row.payload.overall_stars}/5</td>
                        <td className="py-2">{row.payload.overall_rating}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
