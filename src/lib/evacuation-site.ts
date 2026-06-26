/** Evacuation center / outside-EC classification (aligned with crg-idp-profiling). */

export const OUTSIDE_EC_LABEL = "Outside EC";

const OUTSIDE_EC_KEYWORDS = [
  "OUTSIDE EC",
  "OUTSIDE THE EC",
  "OUTSIDE EVACUATION",
  "NOT IN EC",
  "NOT IN EVACUATION",
] as const;

/** Site names that mean the family is outside any evacuation center. */
const OUTSIDE_EC_SITE_NAMES = ["TUYAN"] as const;

export function isOutsideEvacuationSite(site: string | null | undefined): boolean {
  const text = (site ?? "").trim().toUpperCase();
  if (!text) return true;

  if (OUTSIDE_EC_SITE_NAMES.includes(text as (typeof OUTSIDE_EC_SITE_NAMES)[number])) {
    return true;
  }

  return OUTSIDE_EC_KEYWORDS.some(
    (keyword) => text === keyword || text.startsWith(keyword) || text.includes(keyword),
  );
}

export function isRecordInsideEc(record: {
  evacuation_center_status?: "" | "yes" | "no";
  evacuation_center_site?: string;
}): boolean {
  if (record.evacuation_center_status === "no") return false;

  const site = record.evacuation_center_site?.trim() ?? "";
  if (isOutsideEvacuationSite(site)) return false;

  if (record.evacuation_center_status === "yes") return true;

  return Boolean(site);
}

export function evacuationSiteLabel(record: {
  evacuation_center_status?: "" | "yes" | "no";
  evacuation_center_site?: string;
}): string {
  if (isRecordInsideEc(record)) {
    const site = record.evacuation_center_site?.trim();
    if (site) return site;
    return "Evacuation Center (unspecified)";
  }
  return OUTSIDE_EC_LABEL;
}
