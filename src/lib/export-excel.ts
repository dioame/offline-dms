import * as XLSX from "xlsx";
import { mergePermanentAddressLine, type FacedRecord } from "./faced-types";

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
    "Bank/E-Wallet": r.account_information.bank_e_wallet_name,
    "Account Name": r.account_information.account_name,
    "Account Type": r.account_information.account_type,
    "Account Number": r.account_information.account_number,
    Owner: r.house_ownership.owner ? "Yes" : "No",
    Renter: r.house_ownership.renter ? "Yes" : "No",
    Sharer: r.house_ownership.sharer ? "Yes" : "No",
    "Partially Damaged": r.shelter_damage_classification.partially_damaged
      ? "Yes"
      : "No",
    "Totally Damaged": r.shelter_damage_classification.totally_damaged
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
