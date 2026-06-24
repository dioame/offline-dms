import type { FamilyHead, FamilyMember } from "./faced-print-types";
import { emptyPrintMember } from "./faced-print-types";

export function pad2(s: string): string {
  const t = (s || "").trim();
  if (!t || !/^\d+$/.test(t)) return t;
  return t.padStart(2, "0");
}

export function displayVal(v?: string | null): string {
  const t = (v ?? "").trim();
  if (!t) return "\u00A0";
  return t.toUpperCase();
}

export function formatBirth(mm: string, dd: string, yyyy: string): string {
  const m = pad2(mm);
  const d = pad2(dd);
  const y = (yyyy || "").trim();
  if (!m && !d && !y) return "";
  return [m, d, y].filter(Boolean).join("-");
}

export function headVulnerability(head: FamilyHead): string {
  const tags: string[] = [];
  if (head.pregnant === "Y") tags.push("Pregnant");
  if (head.lactating === "Y") tags.push("Lactating");
  if (head.solo_parent === "Y") tags.push("Solo Parent");
  if (head.person_with_disability === "Y") tags.push("PWD");
  if (head.single_headed_family === "Y") tags.push("Single-Headed Family");
  return tags.join(", ");
}

export function headOthersLine(head: FamilyHead): string {
  const parts: string[] = [];
  if (head.four_ps_beneficiary === "Y") parts.push("4Ps Beneficiary");
  if (head.indigenous_person === "Y") {
    parts.push(
      `IP (Type of Ethnicity: ${displayVal(head.ethnicity).replace(/\u00a0/g, "") || "_______"})`,
    );
  } else if (head.ethnicity?.trim()) {
    parts.push(`Ethnicity: ${head.ethnicity.trim()}`);
  }
  return parts.join("   ");
}

export function formatAgeDisplay(age?: string | null): string {
  const t = (age ?? "").trim();
  if (!t) return "";
  const n = Number.parseFloat(t);
  if (!Number.isNaN(n) && Number.isFinite(n)) return String(Math.round(n));
  return t;
}

export function formatSexDisplay(sex?: string | null): string {
  const v = (sex ?? "").trim().toUpperCase();
  if (v === "M" || v === "MALE") return "M";
  if (v === "F" || v === "FEMALE") return "F";
  return v;
}

export function memberDisplayName(m: FamilyMember): string {
  const concat = (m.concatenated_name || "").trim();
  if (concat) return concat;
  return [m.last_name, m.first_name, m.middle_name, m.ext_name].filter(Boolean).join(" ").trim();
}

export function membersForHead(
  head: FamilyHead,
  membersByHead: Map<string, FamilyMember[]>,
): FamilyMember[] {
  const key = head.serial_code.trim().toUpperCase();
  return membersByHead.get(key) ?? [];
}

export function memberRows(members: FamilyMember[], minRows = 5): FamilyMember[] {
  const rows = [...members];
  while (rows.length < minRows) {
    rows.push({ ...emptyPrintMember(), id: -rows.length });
  }
  return rows;
}

export function markChecked(label: string, active: boolean): string {
  return `${active ? "☑" : "☐"} ${label}`;
}

export function matchHouseOwnership(value: string, option: string): boolean {
  const v = (value || "").trim().toUpperCase();
  const o = option.toUpperCase();
  if (!v) return false;
  if (o === "INFORMAL SETTLER") return v.includes("INFORMAL") || v.includes("SETTLER");
  if (o === "NOT IDENTIFIED") return v.includes("NOT IDENT");
  return v.includes(o);
}

export function matchDamage(value: string, option: string): boolean {
  const v = (value || "").trim().toUpperCase();
  const o = option.toUpperCase();
  if (!v) return false;
  if (o === "PARTIALLY DAMAGED") return v.includes("PARTIAL");
  if (o === "TOTALLY DAMAGED") return v.includes("TOTAL");
  if (o === "NOT IDENTIFIED") return v.includes("NOT IDENT");
  return v.includes(o);
}

export function headExtraField(head: FamilyHead, key: string): string {
  return String((head as unknown as Record<string, string | undefined>)[key] ?? "").trim();
}
