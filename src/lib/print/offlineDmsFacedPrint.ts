import type { TursoExportRecord } from "../faced-export-shared";
import type {
  FacedRecordData,
  FamilyMember as FormFamilyMember,
  HeadOfFamily,
  HouseOwnership,
  PermanentAddress,
  ShelterDamageClassification,
} from "../faced-types";
import { mergePermanentAddressLine } from "../faced-types";
import { resolveFacedSerialNumber } from "../faced-serial";
import { formatBirth, formatAgeDisplay, formatSexDisplay } from "./facedAnnexPrint";
import type { FamilyHead, FamilyMember, FamilyAssistancePrintRow } from "./faced-print-types";

function clean(v: unknown): string {
  if (v == null) return "";
  const s = String(v).trim();
  if (!s || s.toUpperCase() === "N/A") return "";
  return s;
}

function expandYear(yearPart: string): string {
  if (yearPart.length === 4) return yearPart;
  const n = Number.parseInt(yearPart, 10);
  if (Number.isNaN(n)) return yearPart;
  if (yearPart.length <= 2) {
    return n <= 29 ? `20${yearPart.padStart(2, "0")}` : `19${yearPart.padStart(2, "0")}`;
  }
  return yearPart;
}

function parseBirthdate(value: string): { mm: string; dd: string; yyyy: string } {
  const trimmed = value.trim();
  if (!trimmed) return { mm: "", dd: "", yyyy: "" };

  const iso = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    return {
      yyyy: iso[1],
      mm: iso[2].padStart(2, "0"),
      dd: iso[3].padStart(2, "0"),
    };
  }

  const slash = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (slash) {
    return {
      mm: slash[1].padStart(2, "0"),
      dd: slash[2].padStart(2, "0"),
      yyyy: expandYear(slash[3]),
    };
  }

  return { mm: "", dd: "", yyyy: "" };
}

function sexFromHead(head: HeadOfFamily): string {
  const sex = clean(head.sex);
  if (sex) {
    const v = sex.toUpperCase();
    if (v === "M" || v === "MALE") return "M";
    if (v === "F" || v === "FEMALE") return "F";
    return sex;
  }
  if (head.female) return "F";
  if (head.male) return "M";
  return "";
}

function houseOwnershipLabel(h: HouseOwnership): string {
  if (h.not_identified) return "Not Identified";
  if (h.owner) return "Owner";
  if (h.renter) return "Renter";
  if (h.sharer) return "Sharer";
  return "";
}

function damageLabel(s: ShelterDamageClassification): string {
  if (s.not_identified) return "Not Identified";
  if (s.totally_damaged) return "Totally";
  if (s.partially_damaged) return "Partially";
  return "";
}

function formatPermanentAddress(addr: PermanentAddress): string {
  const line = mergePermanentAddressLine(addr);
  const parts = [
    line,
    clean(addr.barangay),
    clean(addr.city_municipality),
    clean(addr.province),
    clean(addr.zip_code),
  ].filter(Boolean);
  return parts.join(", ");
}

function contactFromHead(head: HeadOfFamily): string {
  const contact = head.contact_number;
  if (!contact) return "";
  return clean(contact.primary) || clean(contact.alternate);
}

function serialCode(record: TursoExportRecord): string {
  return resolveFacedSerialNumber(record);
}

function evacuationCenter(data: FacedRecordData): string {
  if (data.evacuation_center_status === "yes") {
    return clean(data.evacuation_center_site) || "YES";
  }
  if (data.evacuation_center_status === "no") {
    return clean(data.evacuation_center_site) || "NO";
  }
  return clean(data.evacuation_center_site);
}

function recordToPrintHead(record: TursoExportRecord): FamilyHead {
  const head = record.head_of_family;
  const birth = parseBirthdate(head.birthdate);
  const serial = serialCode(record);
  const concatenated = [head.last_name, head.first_name, head.middle_name, head.name_extension]
    .filter(Boolean)
    .join(", ");

  return {
    id: 0,
    row_number: 0,
    sn_prefix: "PWA",
    counter: "",
    serial_code: serial,
    date_added: record.createdAt ?? null,
    date_updated: record.updatedAt ?? null,
    last_name: clean(head.last_name),
    first_name: clean(head.first_name),
    middle_name: clean(head.middle_name),
    ext_name: clean(head.name_extension),
    concatenated_name: concatenated,
    birth_mm: birth.mm,
    birth_dd: birth.dd,
    birth_yyyy: birth.yyyy,
    concatenated_bdate: formatBirth(birth.mm, birth.dd, birth.yyyy),
    age_display: formatAgeDisplay(head.age),
    age_group: "",
    sex: sexFromHead(head),
    civil_status: clean(head.civil_status),
    barangay_origin: clean(record.barangay),
    region: clean(record.region),
    province: clean(record.province),
    city_mun: clean(record.city_municipality),
    district: clean(record.district),
    location_barangay: clean(record.barangay),
    evacuation_center: evacuationCenter(record),
    contact_number: contactFromHead(head),
    permanent_address: formatPermanentAddress(record.permanent_address),
    birthplace: clean(head.birthplace),
    mothers_maiden_name: clean(head.mothers_maiden_name),
    religion: clean(record.others.religion),
    occupation: clean(head.occupation),
    monthly_income: clean(head.monthly_family_net_income),
    id_card_type: clean(head.id_card_presented),
    id_card_number: clean(head.id_card_number),
    ethnicity: clean(record.others.ip_type_of_ethnicity),
    pregnant: "",
    lactating: "",
    child_headed_family: "",
    single_headed_family: "",
    solo_parent: "",
    person_with_disability: "",
    indigenous_person: record.others.ip_type_of_ethnicity?.trim() ? "Y" : "",
    four_ps_beneficiary: record.others["4ps_beneficiary"] ? "Y" : "",
    house_ownership: houseOwnershipLabel(record.house_ownership),
    damage_classification: damageLabel(record.shelter_damage_classification),
    still_in_ec: record.evacuation_center_status === "yes" ? "Y" : "",
    bank_ewallet: clean(record.account_information.bank_e_wallet_name),
    account_name: clean(record.account_information.account_name),
    account_type: clean(record.account_information.account_type),
    account_number: clean(record.account_information.account_number),
    validation_remarks: "",
  };
}

function memberToPrintMember(
  member: FormFamilyMember,
  head: FamilyHead,
  index: number,
): FamilyMember {
  const birth = parseBirthdate(member.birthdate);
  const name = clean(member.family_member_name);

  return {
    id: index,
    row_number: index + 1,
    head_serial_code: head.serial_code,
    family_head_name: head.concatenated_name,
    still_in_ec: head.still_in_ec || "Y",
    sn_prefix: "PWA-FM",
    counter: String(index + 1).padStart(4, "0"),
    serial_code: `${head.serial_code}-FM${String(index + 1).padStart(2, "0")}`,
    last_name: "",
    first_name: "",
    middle_name: "",
    ext_name: "",
    concatenated_name: name,
    relation_to_head: clean(member.relationship_to_family_head),
    birth_mm: birth.mm,
    birth_dd: birth.dd,
    birth_yyyy: birth.yyyy,
    concatenated_bdate: formatBirth(birth.mm, birth.dd, birth.yyyy),
    age_display: formatAgeDisplay(member.age),
    age_group: "",
    sex: formatSexDisplay(member.sex),
    civil_status: "",
    barangay_origin: head.location_barangay || head.barangay_origin,
    education: clean(member.highest_educational_attainment),
    occupation: clean(member.occupation),
    vulnerability: clean(member.type_of_vulnerability),
    pregnant: "",
    lactating: "",
    solo_parent: "",
    person_with_disability: "",
    indigenous_person: "",
    four_ps_beneficiary: "",
    validation_remarks: "",
  };
}

export function buildOfflineDmsPrintBundle(
  record: TursoExportRecord,
): { head: FamilyHead; members: FamilyMember[] } {
  const head = recordToPrintHead(record);
  const members = (record.family_members ?? [])
    .filter((m) => clean(m.family_member_name) || clean(m.relationship_to_family_head))
    .map((m, i) => memberToPrintMember(m, head, i));
  return { head, members };
}

export function buildOfflineDmsPrintMap(
  record: TursoExportRecord,
): Map<string, FamilyMember[]> {
  const { head, members } = buildOfflineDmsPrintBundle(record);
  const key = head.serial_code.trim().toUpperCase();
  return new Map([[key, members]]);
}

export function buildOfflineDmsPrintBundles(records: TursoExportRecord[]): {
  heads: FamilyHead[];
  membersByHead: Map<string, FamilyMember[]>;
} {
  const heads: FamilyHead[] = [];
  const membersByHead = new Map<string, FamilyMember[]>();

  for (const record of records) {
    const { head, members } = buildOfflineDmsPrintBundle(record);
    const key = head.serial_code.trim().toUpperCase();
    heads.push(head);
    membersByHead.set(key, members);
  }

  return { heads, membersByHead };
}

export function buildAssistanceByHeadForPrint(
  records: TursoExportRecord[],
  assistanceByUuid: Map<string, FamilyAssistancePrintRow[]>,
): Map<string, FamilyAssistancePrintRow[]> {
  const assistanceByHead = new Map<string, FamilyAssistancePrintRow[]>();

  for (const record of records) {
    const head = recordToPrintHead(record);
    const key = head.serial_code.trim().toUpperCase();
    assistanceByHead.set(key, assistanceByUuid.get(record.uuid) ?? []);
  }

  return assistanceByHead;
}
