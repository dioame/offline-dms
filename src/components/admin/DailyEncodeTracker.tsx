"use client";

import { useMemo, useState } from "react";

export type DailyEncodeStat = {
  date: string;
  count: number;
};

type DailyEncodeTrackerProps = {
  data: DailyEncodeStat[];
  loading?: boolean;
};

const PERIOD_OPTIONS = [7, 14, 30] as const;

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDayLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DailyEncodeTracker({ data, loading }: DailyEncodeTrackerProps) {
  const [days, setDays] = useState<(typeof PERIOD_OPTIONS)[number]>(7);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const slice = useMemo(() => data.slice(-days), [data, days]);

  const stats = useMemo(() => {
    const total = slice.reduce((sum, row) => sum + row.count, 0);
    const avg = slice.length > 0 ? total / slice.length : 0;
    const peak = slice.reduce(
      (best, row) => (row.count > best.count ? row : best),
      slice[0] ?? { date: "", count: 0 },
    );
    const today = slice[slice.length - 1]?.count ?? 0;
    const yesterday = slice[slice.length - 2]?.count ?? 0;

    let cumulative = 0;
    const cumulativeSeries = slice.map((row) => {
      cumulative += row.count;
      return cumulative;
    });

    return { total, avg, peak, today, yesterday, cumulativeSeries };
  }, [slice]);

  const maxCount = useMemo(
    () => Math.max(1, ...slice.map((row) => row.count)),
    [slice],
  );

  const chartWidth = 640;
  const chartHeight = 180;
  const padLeft = 36;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 28;
  const innerW = chartWidth - padLeft - padRight;
  const innerH = chartHeight - padTop - padBottom;
  const barGap = 2;
  const barWidth = slice.length > 0 ? innerW / slice.length - barGap : 0;

  const labelStep = days <= 7 ? 1 : days <= 14 ? 2 : 5;

  if (loading && data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--faced-blue-border)] bg-white px-4 py-6">
        <p className="text-sm text-zinc-500">Loading daily encode stats...</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--faced-blue-border)] bg-white px-4 py-6">
        <p className="text-sm text-zinc-500">No encode activity recorded yet.</p>
      </div>
    );
  }

  const activeIndex = hoveredIndex ?? slice.length - 1;
  const activeRow = slice[activeIndex];

  return (
    <div className="space-y-4 rounded-lg border border-[var(--faced-blue-border)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wide text-[var(--ph-blue-dark)]">
            Daily encoding
          </h3>
          <p className="text-xs text-zinc-600">
            Records synced per day (by created date)
          </p>
        </div>
        <div className="flex rounded-lg border border-[var(--faced-blue-border)] p-0.5">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setDays(option)}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                days === option
                  ? "bg-[var(--ph-blue)] text-white"
                  : "text-zinc-600 hover:bg-[var(--ph-blue-light)]"
              }`}
            >
              {option}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-md border border-[var(--faced-blue-border)] bg-[var(--ph-blue-light)]/40 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--ph-blue-dark)]">
            Period total
          </p>
          <p className="text-xl font-bold text-[var(--ph-blue-dark)]">{stats.total}</p>
        </div>
        <div className="rounded-md border border-[var(--faced-blue-border)] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">
            Daily average
          </p>
          <p className="text-xl font-bold text-zinc-900">{stats.avg.toFixed(1)}</p>
        </div>
        <div className="rounded-md border border-[var(--faced-blue-border)] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">
            Peak day
          </p>
          <p className="text-xl font-bold text-zinc-900">{stats.peak.count}</p>
          <p className="text-[10px] text-zinc-500">{formatDayLabel(stats.peak.date)}</p>
        </div>
        <div className="rounded-md border border-[var(--faced-blue-border)] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">Today</p>
          <p className="text-xl font-bold text-zinc-900">{stats.today}</p>
        </div>
        <div className="rounded-md border border-[var(--faced-blue-border)] px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">
            Yesterday
          </p>
          <p className="text-xl font-bold text-zinc-900">{stats.yesterday}</p>
        </div>
      </div>

      {activeRow && (
        <p className="text-xs text-zinc-600">
          <span className="font-semibold text-[var(--ph-blue-dark)]">
            {activeRow.count}
          </span>{" "}
          encoded on {formatDayLong(activeRow.date)}
        </p>
      )}

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="min-w-[320px] w-full"
          role="img"
          aria-label={`Bar chart of daily encodes over the last ${days} days`}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = padTop + innerH - tick * innerH;
            const value = Math.round(maxCount * tick);
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={chartWidth - padRight}
                  y2={y}
                  stroke="var(--faced-blue-border)"
                  strokeWidth={1}
                  strokeDasharray={tick === 0 ? undefined : "4 4"}
                />
                <text
                  x={padLeft - 6}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-zinc-500 text-[9px]"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {slice.map((row, index) => {
            const barH = (row.count / maxCount) * innerH;
            const x = padLeft + index * (barWidth + barGap);
            const y = padTop + innerH - barH;
            const isActive = index === activeIndex;

            return (
              <g
                key={row.date}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={Math.max(barWidth, 2)}
                  height={Math.max(barH, row.count > 0 ? 2 : 0)}
                  rx={2}
                  fill={isActive ? "var(--ph-blue)" : "var(--ph-blue-light)"}
                  stroke={isActive ? "var(--ph-blue-dark)" : "transparent"}
                  strokeWidth={1}
                  className="cursor-pointer transition-opacity"
                />
                {index % labelStep === 0 || index === slice.length - 1 ? (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 8}
                    textAnchor="middle"
                    className="fill-zinc-500 text-[8px]"
                  >
                    {formatDayLabel(row.date)}
                  </text>
                ) : null}
              </g>
            );
          })}

          {stats.cumulativeSeries.length > 1 && (
            <polyline
              fill="none"
              stroke="var(--ph-yellow-dark)"
              strokeWidth={2}
              strokeLinejoin="round"
              points={stats.cumulativeSeries
                .map((value, index) => {
                  const x = padLeft + index * (barWidth + barGap) + barWidth / 2;
                  const y = padTop + innerH - (value / stats.total) * innerH * 0.85;
                  return `${x},${y}`;
                })
                .join(" ")}
            />
          )}
        </svg>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-600">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--ph-blue)]" />
          Daily count
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 bg-[var(--ph-yellow-dark)]" />
          Cumulative trend
        </span>
      </div>

      <div className="overflow-x-auto lg:hidden">
        <table className="faced-table w-full min-w-[280px] text-xs">
          <thead>
            <tr>
              <th>Date</th>
              <th>Encoded</th>
              <th>Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {[...slice].reverse().slice(0, 7).map((row, reverseIndex) => {
              const index = slice.length - 1 - reverseIndex;
              const cumulative = stats.cumulativeSeries[index] ?? 0;
              return (
                <tr key={row.date}>
                  <td>{formatDayLong(row.date)}</td>
                  <td className="font-semibold text-[var(--ph-blue-dark)]">{row.count}</td>
                  <td>{cumulative}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
