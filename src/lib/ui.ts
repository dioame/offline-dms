import { cn } from "./cn";

/* ── Layout / shell ───────────────────────────────────────────── */

export const pageBg =
  "min-h-full bg-background bg-[radial-gradient(circle_at_20%_10%,rgba(0,56,168,0.04)_0%,transparent_50%),radial-gradient(circle_at_80%_90%,rgba(206,17,38,0.03)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(253,185,19,0.04)_0%,transparent_60%)]";

export const appHeader =
  "bg-gradient-to-br from-ph-blue-dark from-0% via-ph-blue via-[55%] to-[#0048c8] text-white shadow-[0_4px_20px_rgba(0,40,120,0.25)]";

export const kicker = "text-ph-yellow tracking-[0.12em]";
export const subtitle = "text-white/82";

export const card = cn(
  "overflow-hidden rounded-xl border border-faced-blue-border bg-white shadow-card",
);
export const cardHeader = cn(
  "border-b border-faced-blue-border bg-gradient-to-r from-ph-blue-light to-white px-5 py-3.5",
  "[&_h2]:text-[1.0625rem] [&_h2]:font-bold [&_h2]:text-ph-blue-dark",
);
export const loginCard = cn(card, "shadow-card-lg");

/* ── FACED form ───────────────────────────────────────────────── */

export const formBanner = cn(
  "relative rounded-xl border border-faced-blue-border bg-gradient-to-b from-white to-ph-blue-light",
  "px-4 pb-4 pt-5 text-center shadow-card",
  "before:absolute before:inset-x-0 before:top-0 before:h-1 before:rounded-t-xl",
  "before:bg-[linear-gradient(to_right,var(--ph-blue)_33.33%,var(--ph-red)_33.33%_66.66%,var(--ph-yellow)_66.66%)]",
);

export const sectionHeader = cn(
  "flex items-center border-l-4 border-ph-yellow border-t border-white/10",
  "bg-gradient-to-br from-ph-blue to-ph-blue-dark px-4 py-2.25",
  "text-[0.8125rem] font-bold uppercase tracking-wide text-white",
  "shadow-[inset_0_-1px_0_rgba(0,0,0,0.1)]",
);

export const sectionBody = cn(
  "border-x border-faced-blue-border bg-white p-4",
  "last:rounded-b-lg last:border-b",
);

export const field = "block min-h-0 text-left";
export const label = "mb-1 block text-xs font-semibold text-gray-700";
export const fieldNum = cn(
  "mr-1.5 inline-flex h-[1.375rem] min-w-[1.375rem] items-center justify-center",
  "rounded border border-ph-yellow/50 bg-ph-yellow-light text-[0.6875rem] font-extrabold text-ph-blue-dark",
);
export const required = "ml-1 font-extrabold text-ph-red";

export const input = cn(
  "w-full rounded-md border border-faced-blue-border bg-white px-2.5 py-[0.4375rem]",
  "text-sm text-gray-900 outline-none transition",
  "focus:border-ph-blue focus:shadow-[0_0_0_3px_rgba(0,56,168,0.15)]",
  "disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-gray-500",
);

export const textarea = cn(input, "min-h-10 resize-y");

export const table = cn(
  "w-full border-collapse overflow-hidden rounded-md text-sm",
  "[&_th]:border [&_th]:border-faced-blue-border [&_th]:bg-gradient-to-b [&_th]:from-ph-blue-light [&_th]:to-[#dce6f5]",
  "[&_th]:px-1.5 [&_th]:py-2 [&_th]:text-left [&_th]:text-[0.6875rem] [&_th]:font-bold [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-ph-blue-dark",
  "[&_td]:border [&_td]:border-faced-blue-border [&_td]:bg-white [&_td]:p-1.5 [&_td]:align-top",
  "[&_tbody_tr:hover_td]:bg-ph-blue-light/40",
  "[&_input]:border-none [&_input]:bg-transparent [&_input]:p-1 [&_input]:shadow-none",
  "[&_input:focus]:rounded [&_input:focus]:bg-white [&_input:focus]:shadow-[inset_0_0_0_2px_var(--ph-blue)]",
  "[&_select]:border-none [&_select]:bg-transparent [&_select]:p-1 [&_select]:shadow-none",
  "[&_select:focus]:rounded [&_select:focus]:bg-white [&_select:focus]:shadow-[inset_0_0_0_2px_var(--ph-blue)]",
);

export const chip = cn(
  "rounded-full border-[1.5px] border-faced-blue-border bg-white px-3.5 py-1.25",
  "text-xs font-semibold text-ph-blue transition",
  "hover:-translate-y-px hover:border-ph-blue hover:bg-ph-blue hover:text-white",
);

export const radioGroupStart = cn(
  "flex w-full flex-wrap items-center justify-start gap-x-10 gap-y-2",
);
export const radioGroupEven = cn(
  "flex w-full flex-wrap items-center justify-evenly gap-x-2 gap-y-3 [&>label]:justify-start",
);

/* ── Buttons ─────────────────────────────────────────────────── */

export const btnPrimary = cn(
  "rounded-lg bg-gradient-to-b from-ph-blue to-ph-blue-dark px-5 py-2.5 font-semibold text-white",
  "shadow-[0_2px_8px_rgba(0,56,168,0.3)] transition",
  "hover:enabled:brightness-110 hover:enabled:shadow-[0_4px_12px_rgba(0,56,168,0.35)]",
  "active:enabled:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none",
);

export const btnSecondary = cn(
  "rounded-lg border-[1.5px] border-ph-blue bg-white px-4 py-2 font-semibold text-ph-blue transition",
  "hover:bg-ph-blue-light",
);

export const btnDanger = cn(
  "rounded-lg border-[1.5px] border-ph-red bg-white px-4 py-2 font-semibold text-ph-red transition",
  "hover:bg-ph-red-light",
);

export const headerBtn = cn(
  "inline-flex items-center justify-center rounded-lg border-[1.5px] border-white/55",
  "bg-white/14 px-4 py-2 text-sm font-semibold text-white no-underline transition",
  "hover:border-white/80 hover:bg-white/24",
);

export const headerBtnDanger = cn(
  headerBtn,
  "border-red-200/75 bg-ph-red/22 hover:border-red-200/90 hover:bg-ph-red/38",
);

/* ── Alerts / badges / links ───────────────────────────────────── */

export const alertWarning = cn(
  "rounded-lg border border-ph-yellow/50 bg-ph-yellow-light px-3.5 py-2.5 text-[0.8125rem] text-[#7a5a00]",
);
export const alertError = cn(
  "rounded-lg border border-ph-red/30 bg-ph-red-light px-3.5 py-2.5 text-sm text-ph-red-dark",
);
export const alertSuccess = cn(
  "rounded-lg border border-ph-blue/20 bg-ph-blue-light px-3.5 py-2.5 text-sm text-ph-blue-dark",
);

export const sessionBar = cn(
  "border-b border-faced-blue-border bg-gradient-to-r from-ph-yellow-light to-ph-blue-light",
);

export const badgeOnline = cn(
  "rounded-full border border-ph-blue/20 bg-ph-blue-light text-ph-blue-dark",
);
export const badgeOffline = cn(
  "rounded-full border border-ph-yellow/45 bg-ph-yellow-light text-[#7a5a00]",
);
export const badgeSynced = "rounded-full bg-ph-blue-light text-ph-blue-dark";
export const badgePending = "rounded-full bg-ph-yellow-light text-[#7a5a00]";
export const badgeFailed = "rounded-full bg-ph-red-light text-ph-red-dark";

export const link = cn(
  "font-semibold text-ph-blue transition hover:text-ph-red hover:underline",
);
export const linkOnDark = "font-semibold text-ph-yellow transition hover:text-white";

/* ── Family member cards ───────────────────────────────────────── */

export const familyCard = cn(
  "overflow-hidden rounded-xl border border-faced-blue-border bg-white",
  "shadow-[0_2px_12px_-2px_rgba(0,56,168,0.1)]",
);
export const familyCardHeader = cn(
  "flex items-start justify-between gap-3 border-b border-l-4 border-faced-blue-border border-l-ph-yellow",
  "bg-gradient-to-r from-ph-blue-light to-white px-4 py-3.5",
);
export const familyBadge = cn(
  "mb-1 inline-block rounded-full bg-ph-blue px-2 py-0.5 text-[0.625rem] font-extrabold tracking-wider text-white",
);
export const familyTitle = "break-words text-[0.9375rem] font-bold leading-snug text-ph-blue-dark";
export const familySubtitle = "mt-0.5 text-xs text-gray-500";
export const familyRemove = cn(
  "shrink-0 rounded-md border border-ph-red/35 bg-ph-red-light px-2.5 py-1.5",
  "text-xs font-bold text-ph-red transition hover:bg-[#fbd0d6]",
);
export const familyCardBody = "flex flex-col gap-3.5 p-4";
export const familyList = "flex flex-col gap-4";
export const familyAddBtn = cn(
  "flex w-full items-center justify-center gap-2 rounded-[0.625rem] border-2 border-dashed",
  "border-faced-blue-border bg-ph-blue-light px-4 py-3.5 text-sm font-bold text-ph-blue transition",
  "hover:border-ph-blue hover:bg-white",
);

/* ── Admin code cards ──────────────────────────────────────────── */

export const adminCodeCard = cn(
  "overflow-hidden rounded-[0.625rem] border border-faced-blue-border bg-white",
);
export const adminCodeCardHeader = cn(
  "flex items-center justify-between gap-2 border-b border-faced-blue-border bg-ph-blue-light px-3 py-2.5",
);

/* ── Verify / encode duplicate ───────────────────────────────── */

export const verifyTabs = cn(
  "flex gap-2 border-b-2 border-faced-blue-border",
);
export const verifyTab = cn(
  "-mb-0.5 cursor-pointer border-b-[3px] border-transparent bg-transparent px-4 py-3",
  "text-sm font-bold text-zinc-500 transition hover:text-ph-blue-dark",
);
export const verifyTabActive = "border-b-ph-blue text-ph-blue-dark";

export const verifyProgress = "h-2.5 overflow-hidden rounded-full bg-ph-blue-light";
export const verifyProgressBar = cn(
  "h-full rounded-full bg-gradient-to-r from-ph-blue to-blue-600 transition-[width] duration-200",
);

export const verifyResultBase = cn(
  "flex items-start gap-4 rounded-xl px-4 py-5 pl-4 shadow-card",
);
export const verifyResultClear = cn(
  verifyResultBase,
  "border-2 border-ph-blue/20 bg-gradient-to-br from-[#f0f6ff] to-[#e8f5e9] text-[#0d3d1a]",
);
export const verifyResultWarning = cn(
  verifyResultBase,
  "border-2 border-ph-yellow/55 bg-gradient-to-br from-ph-yellow-light to-[#fff4e0] text-[#7a4e00]",
);
export const verifyResultIcon = cn(
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[1.375rem] font-extrabold",
);
export const verifyResultIconClear = "bg-green-500 text-white";
export const verifyResultIconWarning = "bg-ph-yellow text-ph-blue-dark";

export const verifyMatchCard = card;
export const verifyMatchCardHeader = cn(
  "flex flex-wrap items-start justify-between gap-3 border-b border-faced-blue-border",
  "bg-gradient-to-r from-ph-blue-light to-white px-5 py-4",
);
export const verifyMatchBadge = cn(
  "rounded-full bg-ph-red-light px-3 py-1 text-[0.6875rem] font-extrabold uppercase tracking-wider text-ph-red-dark",
);
export const verifyMatchGrid = cn(
  "grid gap-3.5 px-5 py-4 text-sm sm:grid-cols-2",
  "[&_dt]:text-[0.6875rem] [&_dt]:font-bold [&_dt]:uppercase [&_dt]:tracking-wider [&_dt]:text-zinc-500",
  "[&_dd]:mt-0.5 [&_dd]:font-semibold [&_dd]:text-zinc-800",
);

export const encodeDuplicateFlag = cn(
  "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[0.8125rem] leading-snug",
);
export const encodeDuplicateChecking = cn(
  encodeDuplicateFlag,
  "border border-faced-blue-border bg-ph-blue-light text-ph-blue-dark",
);
export const encodeDuplicateClear = cn(
  encodeDuplicateFlag,
  "border border-ph-blue/20 bg-[#f0f6ff] text-[#0d3d1a]",
);
export const encodeDuplicateWarning = cn(
  encodeDuplicateFlag,
  "border border-ph-yellow/55 bg-ph-yellow-light text-[#7a4e00]",
);
export const encodeDuplicateFlagIcon = cn(
  "flex h-[1.375rem] w-[1.375rem] shrink-0 items-center justify-center rounded-full",
  "bg-ph-yellow/35 text-xs font-extrabold",
);
export const encodeDuplicatePanel = cn(
  "overflow-hidden rounded-lg border border-ph-yellow/45 bg-[#fffdf8]",
);
export const encodeDuplicateList = "list-none p-0 px-2.5 py-1.5";
export const encodeDuplicateItem = "border-t border-dashed border-ph-yellow/35 py-1 text-xs leading-snug first:border-t-0";
export const encodeDuplicateMore = cn(
  "border-t border-dashed border-ph-yellow/35 px-2.5 py-1.5 text-[0.6875rem] text-zinc-500",
);

/* ── Modals ──────────────────────────────────────────────────── */

export const modalBackdrop = cn(
  "fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4",
);
export const modalBackdropFullscreen = cn(
  "fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/45 p-2 sm:p-4",
);
export const modal = cn(
  "w-full max-w-md overflow-hidden rounded-xl border border-faced-blue-border bg-white",
  "shadow-[0_20px_40px_rgba(0,0,0,0.18)]",
);
export const modalLarge = "max-w-[min(72rem,96vw)]";
export const modalFullscreen = cn(
  "flex h-full max-h-[96vh] w-full max-w-[96vw] flex-col overflow-hidden rounded-xl",
  "border border-faced-blue-border bg-white shadow-[0_20px_40px_rgba(0,0,0,0.18)]",
);
export const modalHeader = "px-4 py-3.5 text-[0.9375rem] font-bold text-white";
export const modalHeaderWarning = "bg-gradient-to-br from-[#c98a00] to-[#a86800]";
export const modalHeaderDanger = "bg-gradient-to-br from-[#b42318] to-[#8f1d14]";
export const modalHeaderInfo = "bg-gradient-to-br from-ph-blue to-ph-blue-dark";
export const modalBody = "p-4";
export const modalActions = cn(
  "flex flex-wrap justify-end gap-2 border-t border-faced-blue-border bg-zinc-50 px-4 py-3",
);

/* ── Topbar nav ────────────────────────────────────────────────── */

export const topbar = cn(
  "sticky top-0 z-45 border-b-2 border-ph-yellow bg-[#0a2d6e] shadow-[0_2px_8px_rgba(0,0,0,0.12)]",
);
export const topbarInner = cn(
  "mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-2",
);
export const topbarKicker = cn(
  "text-[0.6875rem] font-bold uppercase tracking-wider text-white/72",
);
export const topbarLinks = "m-0 flex list-none flex-wrap items-center gap-1.5 p-0";
export const topbarLink = cn(
  "inline-flex items-center rounded-md border border-transparent px-3.5 py-1.5",
  "text-[0.8125rem] font-semibold text-white/88 no-underline transition",
  "hover:border-white/25 hover:bg-white/12 hover:text-white",
);
export const topbarLinkActive = cn(
  "border-ph-yellow/65 bg-white/18 font-bold text-white",
);
export const topbarLinkLogout = cn(
  topbarLink,
  "cursor-pointer border-red-300/45 font-[inherit] text-red-200",
  "hover:border-red-300/65 hover:bg-red-600/22 hover:text-white",
);

/* ── Record actions ────────────────────────────────────────────── */

export const recordActions = cn(
  "flex min-w-56 flex-wrap items-center justify-end gap-1.5",
);
export const recordActionBtn = cn(
  "inline-flex cursor-pointer items-center justify-center whitespace-nowrap rounded-md border px-2.5 py-1.25",
  "text-[0.6875rem] font-bold leading-tight tracking-wide transition",
  "active:enabled:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none",
);
export const recordActionView = cn(
  recordActionBtn,
  "border-slate-300 bg-slate-50 text-slate-600 hover:enabled:border-slate-400 hover:enabled:bg-slate-100 hover:enabled:text-slate-700",
);
export const recordActionEdit = cn(
  recordActionBtn,
  "border-faced-blue-border bg-white text-ph-blue hover:enabled:border-ph-blue hover:enabled:bg-ph-blue-light",
);
export const recordActionPrint = cn(
  recordActionBtn,
  "border-green-900 bg-gradient-to-b from-green-600 to-green-700 text-white shadow-sm",
  "hover:enabled:brightness-105 hover:enabled:shadow-md",
);
export const recordActionDelete = cn(
  recordActionBtn,
  "border-red-300 bg-white text-ph-red hover:enabled:border-ph-red hover:enabled:bg-ph-red-light",
);

/* ── Dashboard / EC reports ──────────────────────────────────── */

export const dashboardFilter = cn(
  "rounded-xl border border-faced-blue-border bg-white px-5 py-4",
);
export const dashboardFilterLabel = "mb-1.5 block text-xs font-bold text-slate-600";
export const dashboardFilterSelect = cn(input);
export const dashboardFilterNote = "mt-3 text-[0.8125rem] text-slate-500";
export const dashboardFilterBadge = cn(
  "inline-flex items-center rounded-full border border-ph-yellow/45 bg-ph-yellow-light",
  "px-3 py-1.5 text-xs font-bold text-ph-blue-dark",
);
export const dashboardSummaryGrid = "grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-3";
export const dashboardStat = cn(
  "rounded-xl border border-faced-blue-border bg-white px-4 py-3.5",
);
export const dashboardStatLabel = cn(
  "text-[0.6875rem] font-bold uppercase tracking-wide text-slate-500",
);
export const dashboardStatValue = cn(
  "mt-1 text-2xl font-extrabold tabular-nums text-ph-blue-dark",
);
export const dashboardToolbar = "flex flex-wrap items-center justify-between gap-4";
export const dashboardNowToggle = "inline-flex items-center gap-2 text-[0.8125rem] text-slate-600";
export const dashboardPanelTitle = cn(
  "mb-4 text-base font-extrabold uppercase tracking-wide text-ph-blue-dark",
);
export const dashboardSubtitle = "mb-3 text-sm font-bold text-slate-700";
export const dashboardEcLabel = "mb-1 text-[0.9375rem] font-extrabold text-ph-blue-dark";
export const dashboardEmpty = cn(
  "rounded-xl border border-dashed border-faced-blue-border bg-slate-50 px-4 py-8 text-center text-sm text-slate-500",
);
export const dashboardShelterGrid = "grid gap-6 md:grid-cols-2";

export const ecBoardHeader = "mb-4 text-center";
export const ecBoardTitle = "text-lg font-extrabold tracking-wide text-ph-blue-dark";
export const ecBoardAsOf = cn(
  "mt-2 inline-block rounded-md bg-ph-blue px-3 py-1 text-xs font-bold text-white",
);
export const ecBoardMetaTable = "mb-4 w-full border-collapse";
export const ecBoardMetaCell = "border border-faced-blue-border px-3 py-2 align-top text-[0.8125rem]";
export const ecBoardMetaCellWide = "w-[60%]";
export const ecBoardMetaCellCenter = "text-center";
export const ecBoardMetaLabel = "font-bold text-ph-blue-dark";
export const ecBoardMetaValue = "font-bold text-ph-blue";
export const ecBoardSummary = "flex flex-wrap justify-center gap-6";
export const ecBoardMetric = "font-extrabold tabular-nums text-ph-blue-dark";
export const ecBoardSection = "mt-5";
export const ecBoardSectionTitle = "mb-2 text-[0.8125rem] font-extrabold uppercase text-ph-blue-dark";
export const ecBoardTableWrap = "overflow-x-auto rounded-md border border-[#5b8fd4]";
export const ecBoardTable = "w-full border-collapse text-[0.8125rem]";
export const ecBoardTh = cn(
  "border border-[#5b8fd4] bg-ph-blue px-2 py-1.75 text-center text-[0.6875rem] font-extrabold uppercase text-white",
);
export const ecBoardThLabel = "min-w-40 text-left";
export const ecBoardThSub = "bg-ph-blue-dark text-[0.625rem]";
export const ecBoardTd = "border border-[#5b8fd4] px-2 py-1.75 text-center";
export const ecBoardTdLabel = "text-left font-semibold text-slate-900";
export const ecBoardAgeName = "block font-bold";
export const ecBoardAgeRange = "block text-[0.6875rem] font-medium text-slate-500";
export const ecBoardTdMetric = "tabular-nums";
export const ecBoardTdBold = "font-extrabold";
export const ecBoardTdTotal = "bg-[#eef4fc] font-extrabold";
export const ecBoardRowAlt = "[&_td]:bg-[#eef4fc]";
export const ecBoardRowTotal = "[&_td]:!bg-ph-blue [&_td]:font-extrabold [&_td]:!text-white";
export const ecInfoBoardGroupLabel = "mb-4";
export const ecInfoBoardReport = cn(
  "rounded-xl border border-faced-blue-border bg-white p-5",
);

/* ── Icon sizing (Lucide) ─────────────────────────────────────── */

export const iconSm = "size-3.5 shrink-0";
export const iconMd = "size-4 shrink-0";
export const iconLg = "size-5 shrink-0";
export const withIcon = "inline-flex items-center justify-center gap-1.5";

/* ── Helpers ───────────────────────────────────────────────────── */

export function verifyTabClass(active: boolean) {
  return cn(verifyTab, active && verifyTabActive);
}

export function topbarLinkClass(active: boolean) {
  return cn(topbarLink, active && topbarLinkActive);
}
