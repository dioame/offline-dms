import * as XLSX from "xlsx";
import { mergePermanentAddressLine, type FacedRecord } from "./faced-types";
import type { TursoExportRecord } from "./faced-export-shared";

export type ExportRecordJson = Omit<FacedRecord, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

export function tursoExportRecordsToFacedRecords(records: TursoExportRecord[]): FacedRecord[] {
  return records.map((record) => ({
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }));
}

export function exportRecordsJsonToFacedRecords(records: ExportRecordJson[]): FacedRecord[] {
  return records.map((record) => ({
    ...record,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }));
}

function headFullName(record: FacedRecord): string {
  const h = record.head_of_family;
  const parts = [h.first_name, h.middle_name, h.last_name, h.name_extension]
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.join(" ");
}

export function exportFacedToExcel(
  records: FacedRecord[],
  filename = "FACED_Records.xlsx",
): void {
  const households = records.map((r) => ({
    UUID: r.uuid,
    "Sync Status": r.sync_status,
    "Enumerator Name": r.enumerator_name ?? "",
    Region: r.region,
    Province: r.province,
    "City/Municipality": r.city_municipality,
    District: r.district,
    Barangay: r.barangay,
    "In Evacuation Center": r.evacuation_center_status === "yes" ? "Yes" : r.evacuation_center_status === "no" ? "No" : "",
    "Evacuation Center/Site": r.evacuation_center_site,
    "Head of Family": headFullName(r),
    "Last Name": r.head_of_family.last_name,
    "First Name": r.head_of_family.first_name,
    "Middle Name": r.head_of_family.middle_name,
    Extension: r.head_of_family.name_extension,
    Birthdate: r.head_of_family.birthdate,
    Age: r.head_of_family.age,
    Birthplace: r.head_of_family.birthplace,
    Sex: r.head_of_family.sex,
    "Civil Status": r.head_of_family.civil_status,
    "Mother's Maiden Name": r.head_of_family.mothers_maiden_name,
    Occupation: r.head_of_family.occupation,
    "Monthly Family Net Income": r.head_of_family.monthly_family_net_income,
    "ID Card Presented": r.head_of_family.id_card_presented,
    "ID Card Number": r.head_of_family.id_card_number,
    "Contact (Primary)": r.head_of_family.contact_number.primary,
    "Contact (Alternate)": r.head_of_family.contact_number.alternate,
    "Permanent Address Line": mergePermanentAddressLine(r.permanent_address),
    "Perm. Barangay": r.permanent_address.barangay,
    "Perm. City/Municipality": r.permanent_address.city_municipality,
    "Perm. Province": r.permanent_address.province,
    "Zip Code": r.permanent_address.zip_code,
    "4Ps Beneficiary": r.others["4ps_beneficiary"] ? "Yes" : "No",
    "IP Type of Ethnicity": r.others.ip_type_of_ethnicity,
    Religion: r.others.religion ?? "",
    "Bank/E-Wallet": r.account_information.bank_e_wallet_name,
    "Account Name": r.account_information.account_name,
    "Account Type": r.account_information.account_type,
    "Account Number": r.account_information.account_number,
    Owner: r.house_ownership.owner ? "Yes" : "No",
    Renter: r.house_ownership.renter ? "Yes" : "No",
    Sharer: r.house_ownership.sharer ? "Yes" : "No",
    "House Ownership Not Identified": r.house_ownership.not_identified ? "Yes" : "No",
    "Partially Damaged": r.shelter_damage_classification.partially_damaged
      ? "Yes"
      : "No",
    "Totally Damaged": r.shelter_damage_classification.totally_damaged
      ? "Yes"
      : "No",
    "Shelter Damage Not Identified": r.shelter_damage_classification.not_identified
      ? "Yes"
      : "No",
    "Date Registered": r.date_registered,
    "Privacy Acknowledged": r.privacy_declaration_acknowledged ? "Yes" : "No",
    "Created At": r.createdAt.toLocaleString(),
  }));

  const members = records.flatMap((r) =>
    r.family_members.map((m) => ({
      "Household UUID": r.uuid,
      "Head of Family": headFullName(r),
      Barangay: r.barangay,
      Name: m.family_member_name,
      Relationship: m.relationship_to_family_head,
      Birthdate: m.birthdate,
      Age: m.age,
      Sex: m.sex,
      Education: m.highest_educational_attainment,
      Occupation: m.occupation,
      Vulnerability: m.type_of_vulnerability,
    })),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(households),
    "Households",
  );
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(members),
    "FamilyMembers",
  );
  XLSX.writeFile(workbook, filename);
}

export type AccessCodeExportRow = {
  code: string;
  enumerator_name: string | null;
  enumerator_email: string | null;
  status: string;
  created_at: string;
  used_at: string | null;
  last_used_at: string | null;
  rejected_at: string | null;
};

function formatExportDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function exportAccessCodesToExcel(
  rows: AccessCodeExportRow[],
  filename = "FACED_Access_Codes.xlsx",
): void {
  const sheet = rows.map((row) => ({
    Code: row.code,
    "Enumerator Name": row.enumerator_name ?? "",
    Email: row.enumerator_email ?? "",
    Status: row.status,
    "Created At": formatExportDate(row.created_at),
    "Used At": formatExportDate(row.used_at),
    "Last Used At": formatExportDate(row.last_used_at),
    "Rejected At": formatExportDate(row.rejected_at),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(sheet), "Access Codes");
  XLSX.writeFile(workbook, filename);
}

import { surveyPayloadToExportRow } from "./survey-types";

export type SurveyExportRow = ReturnType<typeof surveyPayloadToExportRow>;

export function exportSurveyResponsesToExcel(
  rows: SurveyExportRow[],
  filename = "Offline_Online_Faced_App_Survey_Responses.xlsx",
): void {
  const raw = rows.map((row) => ({
    ID: row.id,
    "Submitted At": formatExportDate(row.submitted_at),
    Name: row.name,
    "Office / Division": row.office_division,
    Position: row.position,
    "Region/Field Office": row.region_field_office,
    Date: row.date,
    "Informed About Offline/Online Faced App": row.informed,
    "Usage Duration": row.usage_duration,
    "Usage Frequency": row.usage_frequency,
    "Easy to Understand (1-5)": row.eval_easy_to_understand,
    "Improves Efficiency (1-5)": row.eval_improves_efficiency,
    "Reduces Processing Time (1-5)": row.eval_reduces_processing_time,
    "Minimizes Errors (1-5)": row.eval_minimizes_errors,
    "User-Friendly (1-5)": row.eval_user_friendly,
    "Accurate Information (1-5)": row.eval_accurate_information,
    "Improves Service Delivery (1-5)": row.eval_improves_service_delivery,
    "Transparency & Accountability (1-5)": row.eval_transparency_accountability,
    "Would Recommend (1-5)": row.eval_would_recommend,
    "Overall Satisfied (1-5)": row.eval_overall_satisfied,
    Benefits: row.benefits,
    "Benefits (Others)": row.benefits_others,
    "Work Improvement": row.work_improvement,
    "Aspect Improved Most": row.aspect_improved_most,
    "Sustained Over Time (1-5)": row.sustain_over_time,
    "Replicable (1-5)": row.sustain_replicable,
    "Adequate Support (1-5)": row.sustain_adequate_support,
    "Sufficient Training (1-5)": row.sustain_sufficient_training,
    "Like Most": row.like_most,
    Challenges: row.challenges,
    "Improvements Suggested": row.improvements_suggested,
    "Other Comments": row.other_comments,
    "Overall Stars (1-5)": row.overall_stars,
    "Overall Rating": row.overall_rating,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(raw), "Raw Responses");
  XLSX.writeFile(workbook, filename);
}
