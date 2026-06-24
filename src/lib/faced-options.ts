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

export const EDUCATIONAL_ATTAINMENT_LEVELS = [
  "Kinder",
  "Elementary Level",
  "Elementary Graduate",
  "High School Level",
  "High School Graduate",
  "Senior High Level",
  "Senior High Graduate",
  "College Level",
  "College Graduate",
  "Post Graduate",
  "No Education",
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

export function educationalAttainmentOptions() {
  return EDUCATIONAL_ATTAINMENT_LEVELS.map((level) => ({
    value: level,
    label: level,
  }));
}

export const OCCUPATION_SUGGESTIONS = [
  "Farmer",
  "Fisherfolk",
  "Business",
  "Housewife",
  "Teacher",
  "Driver",
] as const;

export const FAMILY_MEMBER_OCCUPATION_SUGGESTIONS = [
  ...OCCUPATION_SUGGESTIONS,
  "Student",
] as const;

export const ID_CARD_SUGGESTIONS = [
  "PhilHealth",
  "Driver's License",
  "Nat'l ID",
  "Voter's ID",
  "Voter's Certificate",
  "UMID",
  "OSCA ID",
] as const;

export const INCOME_SUGGESTIONS = [
  "3000",
  "5000",
  "8000",
  "10000",
  "15000",
] as const;

export const ETHNICITY_SUGGESTIONS = [
  "Blaan",
  "Bisaya",
  "Maguindanaon",
  "Tausug",
  "Maranao",
] as const;

export const RELIGION_SUGGESTIONS = [
  "Islam",
  "Roman Catholic",
  "Born Again",
  "Seventh Day Adventist",
  "Camacop",
] as const;
