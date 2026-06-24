export type FamilyHead = {
  id: number;
  row_number: number;
  sn_prefix: string;
  counter: string;
  serial_code: string;
  date_added?: string | null;
  date_updated?: string | null;
  last_name: string;
  first_name: string;
  middle_name: string;
  ext_name: string;
  concatenated_name: string;
  birth_mm: string;
  birth_dd: string;
  birth_yyyy: string;
  concatenated_bdate: string;
  age_display: string;
  age_group: string;
  sex: string;
  civil_status: string;
  barangay_origin: string;
  region?: string;
  province?: string;
  city_mun?: string;
  district?: string;
  location_barangay?: string;
  evacuation_center?: string;
  contact_number: string;
  permanent_address: string;
  birthplace: string;
  mothers_maiden_name: string;
  religion: string;
  occupation: string;
  monthly_income: string;
  id_card_type: string;
  id_card_number: string;
  ethnicity: string;
  pregnant: string;
  lactating: string;
  child_headed_family: string;
  single_headed_family: string;
  solo_parent: string;
  person_with_disability: string;
  indigenous_person: string;
  four_ps_beneficiary: string;
  house_ownership: string;
  damage_classification: string;
  still_in_ec: string;
  bank_ewallet: string;
  account_name: string;
  account_type: string;
  account_number: string;
  validation_remarks: string;
};

export type FamilyMember = {
  id: number;
  row_number: number;
  head_serial_code: string;
  family_head_name: string;
  still_in_ec: string;
  sn_prefix: string;
  counter: string;
  serial_code: string;
  date_added?: string | null;
  date_updated?: string | null;
  last_name: string;
  first_name: string;
  middle_name: string;
  ext_name: string;
  concatenated_name: string;
  relation_to_head: string;
  birth_mm: string;
  birth_dd: string;
  birth_yyyy: string;
  concatenated_bdate: string;
  age_display: string;
  age_group: string;
  sex: string;
  civil_status: string;
  barangay_origin: string;
  education: string;
  occupation: string;
  vulnerability: string;
  pregnant: string;
  lactating: string;
  solo_parent: string;
  person_with_disability: string;
  indigenous_person: string;
  four_ps_beneficiary: string;
  validation_remarks: string;
};

export function emptyPrintMember(): FamilyMember {
  return {
    id: 0,
    row_number: 0,
    head_serial_code: "",
    family_head_name: "",
    still_in_ec: "",
    sn_prefix: "",
    counter: "",
    serial_code: "",
    last_name: "",
    first_name: "",
    middle_name: "",
    ext_name: "",
    concatenated_name: "",
    relation_to_head: "",
    birth_mm: "",
    birth_dd: "",
    birth_yyyy: "",
    concatenated_bdate: "",
    age_display: "",
    age_group: "",
    sex: "",
    civil_status: "",
    barangay_origin: "",
    education: "",
    occupation: "",
    vulnerability: "",
    pregnant: "",
    lactating: "",
    solo_parent: "",
    person_with_disability: "",
    indigenous_person: "",
    four_ps_beneficiary: "",
    validation_remarks: "",
  };
}
