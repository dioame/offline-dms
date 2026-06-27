import type { FacedRecordData, SyncStatus } from "./faced-types";
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
    date_provided: new Date().toISOString().slice(0, 10),
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

export const ASSISTANCE_UNIT_SUGGESTIONS = ["box", "pack", "pcs", "set"] as const;

export const ASSISTANCE_PROVIDER_SUGGESTIONS = ["DSWD", "LGU", "NGO"] as const;
