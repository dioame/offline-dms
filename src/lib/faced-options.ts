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

export function relationOptions() {
  return FAMILY_RELATIONS.map((r) => ({ value: r, label: r }));
}

export function vulnerabilityOptions() {
  return VULNERABILITY_TYPES.map((v) => ({ value: v, label: v }));
}
