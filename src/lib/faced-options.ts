import type { FamilyMember } from "./faced-types";

export const FAMILY_RELATIONS = [
  "Spouse",
  "Common-Law Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Grandparent",
  "Grandchild",
  "Parent-In-Law",
  "Sibling-In-Law",
  "Uncle",
  "Aunt",
  "Nephew",
  "Niece",
  "Cousin",
  "Boarder",
  "Helper",
  "Caregiver",
  "Step-Parent",
  "Step-Child",
  "Step-Sibling",
  "Other Relative",
  "Other Non-Relative",
] as const;

export const VULNERABILITY_TYPES = [
  "Pregnant",
  "Lactating",
  "Elderly",
  "PWD",
  "Infant",
] as const;

export type AutoVulnerability = "Elderly" | "Infant";

export function autoVulnerabilityFromAge(age: string): AutoVulnerability | null {
  const n = parseInt(age, 10);
  if (Number.isNaN(n) || age.trim() === "") return null;
  if (n >= 60) return "Elderly";
  if (n <= 1) return "Infant";
  return null;
}

export function applyAgeVulnerability(member: FamilyMember): FamilyMember {
  const defaultVal = autoVulnerabilityFromAge(member.age);
  if (defaultVal) {
    return { ...member, type_of_vulnerability: defaultVal };
  }
  return member;
}

export function relationOptions() {
  return FAMILY_RELATIONS.map((r) => ({ value: r, label: r }));
}

export function vulnerabilityOptions() {
  return VULNERABILITY_TYPES.map((v) => ({ value: v, label: v }));
}
