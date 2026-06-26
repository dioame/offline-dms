import {
  SARANGANI_PROVINCE,
  SARANGANI_REGION,
} from "./sarangani-locations";

export type SyncStatus = "pending" | "synced" | "failed";

export type HeadOfFamily = {
  last_name: string;
  first_name: string;
  middle_name: string;
  name_extension: string;
  birthdate: string;
  age: string;
  birthplace: string;
  sex: string;
  male: boolean;
  female: boolean;
  civil_status: string;
  mothers_maiden_name: string;
  occupation: string;
  monthly_family_net_income: string;
  id_card_presented: string;
  id_card_number: string;
  contact_number: {
    primary: string;
    alternate: string;
  };
};

export type PermanentAddress = {
  address_line: string;
  barangay: string;
  city_municipality: string;
  province: string;
  zip_code: string;
};

export type FamilyMember = {
  family_member_name: string;
  relationship_to_family_head: string;
  birthdate: string;
  age: string;
  sex: string;
  highest_educational_attainment: string;
  occupation: string;
  type_of_vulnerability: string;
};

export type AccountInformation = {
  bank_e_wallet_name: string;
  account_name: string;
  account_type: string;
  account_number: string;
};

export type HouseOwnership = {
  owner: boolean;
  renter: boolean;
  sharer: boolean;
  not_identified: boolean;
};

export type ShelterDamageClassification = {
  partially_damaged: boolean;
  totally_damaged: boolean;
  not_identified: boolean;
};

export function houseOwnershipRadioValue(h: HouseOwnership): string {
  if (h.not_identified) return "not_identified";
  if (h.owner) return "owner";
  if (h.renter) return "renter";
  if (h.sharer) return "sharer";
  return "";
}

export function houseOwnershipFromRadio(value: string): HouseOwnership {
  return {
    owner: value === "owner",
    renter: value === "renter",
    sharer: value === "sharer",
    not_identified: value === "not_identified",
  };
}

export function shelterDamageRadioValue(s: ShelterDamageClassification): string {
  if (s.not_identified) return "not_identified";
  if (s.partially_damaged) return "partially_damaged";
  if (s.totally_damaged) return "totally_damaged";
  return "";
}

export function shelterDamageFromRadio(value: string): ShelterDamageClassification {
  return {
    partially_damaged: value === "partially_damaged",
    totally_damaged: value === "totally_damaged",
    not_identified: value === "not_identified",
  };
}

export function hasHouseOwnershipSelection(h: HouseOwnership): boolean {
  return h.owner || h.renter || h.sharer || h.not_identified;
}

export function hasShelterDamageSelection(s: ShelterDamageClassification): boolean {
  return s.partially_damaged || s.totally_damaged || s.not_identified;
}

export type FacedMetadata = {
  form_type: string;
  program: string;
  version: string;
};

export type FacedRecordData = {
  access_code: string;
  serial_number: string;
  enumerator_name: string;
  region: string;
  province: string;
  city_municipality: string;
  district: string;
  barangay: string;
  evacuation_center_status: "" | "yes" | "no";
  evacuation_center_site: string;
  head_of_family: HeadOfFamily;
  permanent_address: PermanentAddress;
  others: {
    "4ps_beneficiary": boolean;
    ip_type_of_ethnicity: string;
    religion: string;
  };
  family_members: FamilyMember[];
  account_information: AccountInformation;
  house_ownership: HouseOwnership;
  shelter_damage_classification: ShelterDamageClassification;
  date_registered: string;
  privacy_declaration_acknowledged: boolean;
  metadata: FacedMetadata;
};

export type FacedRecord = FacedRecordData & {
  id?: number;
  uuid: string;
  sync_status: SyncStatus;
  createdAt: Date;
  updatedAt: Date;
};

export function emptyFamilyMember(): FamilyMember {
  return {
    family_member_name: "",
    relationship_to_family_head: "",
    birthdate: "",
    age: "",
    sex: "",
    highest_educational_attainment: "",
    occupation: "",
    type_of_vulnerability: "",
  };
}

export function todayDateInputValue(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function createEmptyFacedRecord(
  defaults?: Partial<
    Pick<FacedRecordData, "access_code" | "enumerator_name" | "date_registered">
  >,
): FacedRecordData {
  return {
    access_code: defaults?.access_code ?? "",
    serial_number: "",
    enumerator_name: defaults?.enumerator_name ?? "",
    region: SARANGANI_REGION,
    province: SARANGANI_PROVINCE,
    city_municipality: "",
    district: "",
    barangay: "",
    evacuation_center_status: "",
    evacuation_center_site: "",
    head_of_family: {
      last_name: "",
      first_name: "",
      middle_name: "",
      name_extension: "",
      birthdate: "",
      age: "",
      birthplace: "",
      sex: "",
      male: false,
      female: false,
      civil_status: "",
      mothers_maiden_name: "",
      occupation: "",
      monthly_family_net_income: "",
      id_card_presented: "",
      id_card_number: "",
      contact_number: { primary: "", alternate: "" },
    },
    permanent_address: {
      address_line: "",
      barangay: "",
      city_municipality: "",
      province: SARANGANI_PROVINCE,
      zip_code: "",
    },
    others: {
      "4ps_beneficiary": false,
      ip_type_of_ethnicity: "",
      religion: "",
    },
    family_members: [emptyFamilyMember()],
    account_information: {
      bank_e_wallet_name: "",
      account_name: "",
      account_type: "",
      account_number: "",
    },
    house_ownership: {
      owner: false,
      renter: false,
      sharer: false,
      not_identified: false,
    },
    shelter_damage_classification: {
      partially_damaged: false,
      totally_damaged: false,
      not_identified: false,
    },
    date_registered: defaults?.date_registered ?? todayDateInputValue(),
    privacy_declaration_acknowledged: false,
    metadata: {
      form_type: "DSWD Family Assistance Card (FACED)",
      program: "Emergencies and Disasters",
      version: "",
    },
  };
}

export function toDateInputValue(birthdate: string): string {
  if (!birthdate.trim()) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) return birthdate;
  const parts = birthdate.split(/[-/]/).map((p) => parseInt(p, 10));
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return "";
  const [month, day, year] = parts;
  const fullYear = year < 100 ? 2000 + year : year;
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${fullYear}-${mm}-${dd}`;
}

export function formatDisplayBirthdate(birthdate: string | undefined | null): string {
  const trimmed = birthdate?.trim() ?? "";
  if (!trimmed) return "";
  return toDateInputValue(trimmed) || trimmed;
}

export function computeAge(birthdate: string): string {
  if (!birthdate.trim()) return "";
  let born: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    born = new Date(birthdate + "T00:00:00");
  } else {
    const parts = birthdate.split(/[-/]/).map((p) => parseInt(p, 10));
    if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return "";
    const [month, day, year] = parts;
    const fullYear = year < 100 ? 2000 + year : year;
    born = new Date(fullYear, month - 1, day);
  }
  if (Number.isNaN(born.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }
  return String(Math.max(0, age));
}

export function mergePermanentAddressLine(
  addr: Partial<PermanentAddress> & {
    house_block_lot_no?: string;
    street?: string;
    subdivision_village?: string;
  },
): string {
  if (addr.address_line?.trim()) return addr.address_line;
  return [addr.house_block_lot_no, addr.street, addr.subdivision_village]
    .map((p) => p?.trim())
    .filter(Boolean)
    .join(", ");
}
