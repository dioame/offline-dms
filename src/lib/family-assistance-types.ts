import { todayDateInputValue, type FacedRecordData, type SyncStatus } from "./faced-types";
import { formatHeadName } from "./verify-match";

export type FamilyAssistanceRecordData = {
  faced_record_uuid: string;
  access_code: string;
  date_provided: string;
  receiving_member_name: string;
  assistance_received: string;
  unit: string;
  quantity: string;
  cost_of_assistance: string;
  provider: string;
};

export type FamilyAssistanceRecord = FamilyAssistanceRecordData & {
  id?: number;
  uuid: string;
  sync_status: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type FamilyMemberOption = {
  value: string;
  label: string;
};

export function createEmptyFamilyAssistanceRecord(
  facedRecordUuid: string,
  accessCode = "",
): FamilyAssistanceRecordData {
  return {
    faced_record_uuid: facedRecordUuid,
    access_code: accessCode,
    date_provided: todayDateInputValue(),
    receiving_member_name: "",
    assistance_received: "",
    unit: "",
    quantity: "",
    cost_of_assistance: "",
    provider: "",
  };
}

export function buildFamilyMemberOptions(record: FacedRecordData): FamilyMemberOption[] {
  const headName = formatHeadName(record.head_of_family);
  const options: FamilyMemberOption[] = [];

  if (headName) {
    options.push({ value: headName, label: `${headName} (Head of family)` });
  }

  for (const member of record.family_members) {
    const name = member.family_member_name.trim();
    if (!name) continue;
    if (options.some((option) => option.value.toLowerCase() === name.toLowerCase())) {
      continue;
    }
    const relationship = member.relationship_to_family_head.trim();
    options.push({
      value: name,
      label: relationship ? `${name} (${relationship})` : name,
    });
  }

  return options;
}

export function buildFamilyMemberOptionsFromNames(
  headName: string,
  members: { name: string; relationship?: string }[],
): FamilyMemberOption[] {
  const options: FamilyMemberOption[] = [];
  const normalizedHead = headName.trim();

  if (normalizedHead) {
    options.push({ value: normalizedHead, label: `${normalizedHead} (Head of family)` });
  }

  for (const member of members) {
    const name = member.name.trim();
    if (!name) continue;
    if (options.some((option) => option.value.toLowerCase() === name.toLowerCase())) {
      continue;
    }
    const relationship = member.relationship?.trim() ?? "";
    options.push({
      value: name,
      label: relationship ? `${name} (${relationship})` : name,
    });
  }

  return options;
}

export function serializeFamilyAssistanceRecord(record: FamilyAssistanceRecord) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export const ASSISTANCE_RECEIVED_SUGGESTIONS = [
  "Family Food Pack",
  "Hygiene Kit",
  "Sleeping Kit",
  "Kitchen Kit",
  "Clothing Kit",
  "RTEF",
  "Modular Tent",
  "Family Tent",
  "Laminated Sack",
] as const;

export const ASSISTANCE_UNIT_SUGGESTIONS = ["box", "pack", "pcs", "set", "kit"] as const;

export const ASSISTANCE_PROVIDER_SUGGESTIONS = ["DSWD", "LGU", "NGO"] as const;

export function validateFamilyAssistanceRecord(
  record: FamilyAssistanceRecordData,
): string | null {
  if (!record.date_provided.trim()) {
    return "Please enter the date assistance was provided.";
  }
  if (record.date_provided > todayDateInputValue()) {
    return "Date provided cannot be in the future.";
  }
  if (!record.receiving_member_name.trim()) {
    return "Please enter the receiving family member.";
  }
  if (!record.assistance_received.trim()) {
    return "Please enter the assistance received.";
  }
  if (!record.provider.trim()) {
    return "Please enter the provider.";
  }
  return null;
}

export function assistanceEntryTitle(record: FamilyAssistanceRecordData, index: number): string {
  const assistance = record.assistance_received.trim();
  if (assistance) return assistance;
  return `Assistance entry ${index + 1}`;
}
