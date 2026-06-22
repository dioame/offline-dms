"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  addFacedRecord,
  createEmptyFacedRecord,
  getFacedRecord,
  updateFacedRecord,
} from "@/lib/db";
import {
  computeAge,
  emptyFamilyMember,
  mergePermanentAddressLine,
  toDateInputValue,
  type FacedRecordData,
  type FamilyMember,
} from "@/lib/faced-types";
import {
  barangayOptions,
  municipalityOptions,
  SARANGANI_PROVINCE,
  SARANGANI_REGION,
} from "@/lib/sarangani-locations";
import {
  applyAgeVulnerability,
  OCCUPATION_SUGGESTIONS,
  relationOptions,
  vulnerabilityOptions,
} from "@/lib/faced-options";
import SectionHeader from "./SectionHeader";
import BrandEmblem from "@/components/brand/BrandEmblem";
import {
  CheckboxGroup,
  FormField,
  RadioGroup,
  SelectInput,
  TextInput,
} from "./FormField";

type FacedFormProps = {
  editId?: number | null;
  onSaved: () => void;
  onCancelEdit?: () => void;
};

const CIVIL_STATUS = [
  "SINGLE",
  "MARRIED",
  "WIDOWED",
  "SEPARATED",
  "ANNULLED",
  "COMMON LAW",
].map((v) => ({ value: v, label: v }));

const SEX_OPTIONS = [
  { value: "M", label: "M" },
  { value: "F", label: "F" },
];

const NAME_EXTENSIONS = [
  { value: "Jr.", label: "Jr." },
  { value: "Sr.", label: "Sr." },
  { value: "I", label: "I" },
  { value: "II", label: "II" },
  { value: "III", label: "III" },
  { value: "IV", label: "IV" },
  { value: "V", label: "V" },
  { value: "VI", label: "VI" },
  { value: "VII", label: "VII" },
];

function hasHouseOwnership(form: FacedRecordData): boolean {
  const h = form.house_ownership;
  return h.owner || h.renter || h.sharer;
}

function hasShelterDamage(form: FacedRecordData): boolean {
  const s = form.shelter_damage_classification;
  return s.partially_damaged || s.totally_damaged;
}

function normalizeLoadedRecord(
  data: FacedRecordData & {
    serial_number?: string;
    signatures?: unknown;
    evacuation_center_status?: "" | "yes" | "no";
    permanent_address?: Partial<FacedRecordData["permanent_address"]> & {
      house_block_lot_no?: string;
      street?: string;
      subdivision_village?: string;
    };
  },
): FacedRecordData {
  const perm = data.permanent_address ?? createEmptyFacedRecord().permanent_address;
  return {
    ...data,
    enumerator_name: data.enumerator_name ?? "",
    region: data.region || SARANGANI_REGION,
    province: data.province || SARANGANI_PROVINCE,
    evacuation_center_status:
      data.evacuation_center_status ??
      (data.evacuation_center_site?.trim() ? "yes" : ""),
    permanent_address: {
      address_line: mergePermanentAddressLine(perm),
      barangay: perm.barangay ?? "",
      city_municipality: perm.city_municipality ?? "",
      province: perm.province || SARANGANI_PROVINCE,
      zip_code: perm.zip_code ?? "",
    },
    head_of_family: {
      ...data.head_of_family,
      birthdate: toDateInputValue(data.head_of_family.birthdate),
    },
    family_members: data.family_members.map((m) => {
      const birthdate = toDateInputValue(m.birthdate);
      const age = m.age || computeAge(birthdate);
      return applyAgeVulnerability({ ...m, birthdate, age });
    }),
  };
}

export default function FacedForm({ editId, onSaved, onCancelEdit }: FacedFormProps) {
  const [form, setForm] = useState<FacedRecordData>(createEmptyFacedRecord);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!editId) {
      setForm(createEmptyFacedRecord());
      return;
    }
    void getFacedRecord(editId).then((record) => {
      if (record) {
        const { id: _id, uuid: _uuid, sync_status: _s, createdAt: _c, updatedAt: _u, ...data } =
          record;
        setForm(normalizeLoadedRecord(data));
      }
    });
  }, [editId]);

  function updateField<K extends keyof FacedRecordData>(
    key: K,
    value: FacedRecordData[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateHead<K extends keyof FacedRecordData["head_of_family"]>(
    key: K,
    value: FacedRecordData["head_of_family"][K],
  ) {
    setForm((prev) => ({
      ...prev,
      head_of_family: { ...prev.head_of_family, [key]: value },
    }));
  }

  function updateAddress<K extends keyof FacedRecordData["permanent_address"]>(
    key: K,
    value: FacedRecordData["permanent_address"][K],
  ) {
    setForm((prev) => ({
      ...prev,
      permanent_address: { ...prev.permanent_address, [key]: value },
    }));
  }

  function updateMember(index: number, field: keyof FamilyMember, value: string) {
    setForm((prev) => {
      const members = [...prev.family_members];
      let member = { ...members[index], [field]: value };

      if (field === "birthdate") {
        member.age = computeAge(value);
      }
      if (field === "birthdate" || field === "age") {
        member = applyAgeVulnerability(member);
      }

      members[index] = member;
      return { ...prev, family_members: members };
    });
  }

  function addMember() {
    setForm((prev) => ({
      ...prev,
      family_members: [...prev.family_members, emptyFamilyMember()],
    }));
  }

  function removeMember(index: number) {
    setForm((prev) => ({
      ...prev,
      family_members: prev.family_members.filter((_, i) => i !== index),
    }));
  }

  function handleHeadBirthdate(value: string) {
    updateHead("birthdate", value);
    updateHead("age", computeAge(value));
  }

  function handleSexChange(sex: string) {
    setForm((prev) => ({
      ...prev,
      head_of_family: {
        ...prev.head_of_family,
        sex,
        male: sex === "M" || sex === "MALE",
        female: sex === "F" || sex === "FEMALE",
      },
    }));
  }

  function handleLocationMunicipality(municipality: string) {
    setForm((prev) => ({
      ...prev,
      city_municipality: municipality,
      barangay: "",
      permanent_address: {
        ...prev.permanent_address,
        city_municipality: municipality,
        province: SARANGANI_PROVINCE,
        barangay: "",
      },
    }));
  }

  function handleLocationBarangay(barangay: string) {
    setForm((prev) => ({
      ...prev,
      barangay,
      permanent_address: {
        ...prev.permanent_address,
        barangay,
      },
    }));
  }

  function handlePermMunicipality(municipality: string) {
    setForm((prev) => ({
      ...prev,
      permanent_address: {
        ...prev.permanent_address,
        city_municipality: municipality,
        province: SARANGANI_PROVINCE,
        barangay: "",
      },
    }));
  }

  function handleEvacuationStatus(status: "" | "yes" | "no") {
    setForm((prev) => ({
      ...prev,
      evacuation_center_status: status,
      evacuation_center_site: status === "yes" ? prev.evacuation_center_site : "",
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!form.enumerator_name.trim()) {
      setMessage("Please enter the enumerator name.");
      return;
    }
    if (!form.head_of_family.last_name.trim() || !form.head_of_family.first_name.trim()) {
      setMessage("Please enter the head of family name.");
      return;
    }
    if (!form.barangay.trim()) {
      setMessage("Please select the barangay.");
      return;
    }
    if (!form.city_municipality.trim()) {
      setMessage("Please select the city/municipality.");
      return;
    }
    if (!form.head_of_family.sex.trim()) {
      setMessage("Please select sex.");
      return;
    }
    if (!form.head_of_family.civil_status.trim()) {
      setMessage("Please select civil status.");
      return;
    }
    if (!form.head_of_family.occupation.trim()) {
      setMessage("Please enter occupation.");
      return;
    }
    if (!form.evacuation_center_status) {
      setMessage("Please indicate if the family is in an evacuation center.");
      return;
    }
    if (
      form.evacuation_center_status === "yes" &&
      !form.evacuation_center_site.trim()
    ) {
      setMessage("Please enter the evacuation center/site.");
      return;
    }
    if (
      !form.family_members.some(
        (m) => m.family_member_name.trim() && m.relationship_to_family_head.trim(),
      )
    ) {
      setMessage(
        "Please add at least one family member with name and relationship.",
      );
      return;
    }
    if (!hasHouseOwnership(form)) {
      setMessage("Please select house ownership.");
      return;
    }
    if (!hasShelterDamage(form)) {
      setMessage("Please select shelter damage classification.");
      return;
    }
    if (!form.privacy_declaration_acknowledged) {
      setMessage("Please acknowledge the Data Privacy Declaration.");
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await updateFacedRecord(editId, form);
        setMessage("Record updated locally.");
      } else {
        await addFacedRecord(form);
        setForm(createEmptyFacedRecord());
        setMessage("FACED record saved locally.");
      }
      onSaved();
    } catch {
      setMessage("Could not save record. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="faced-form space-y-0">
      {/* Form header */}
      <div className="faced-form-banner mb-4">
        <BrandEmblem size={56} className="mx-auto mb-2" />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
          Republic of the Philippines
        </p>
        <p className="mt-1 text-sm font-bold text-[var(--ph-blue)]">
          Department of Social Welfare and Development
        </p>
        <h2 className="mt-2 text-base font-extrabold uppercase leading-snug text-[var(--ph-blue-dark)]">
          Family Assistance Card in Emergencies and Disasters
        </h2>
        <p className="mt-1 inline-block rounded-full bg-[var(--ph-yellow)] px-3 py-0.5 text-xs font-extrabold tracking-wide text-[var(--ph-blue-dark)]">
          FACED
        </p>
      </div>

      <SectionHeader title="Enumerator" />
      <div className="faced-section-body">
        <FormField label="Enumerator Name">
          <TextInput
            value={form.enumerator_name}
            onChange={(e) => updateField("enumerator_name", e.target.value)}
            placeholder="Full name of field enumerator"
            autoComplete="name"
          />
        </FormField>
      </div>

      {/* Location */}
      <SectionHeader title="Location of the Affected Family" />
      <div className="faced-section-body grid gap-3 sm:grid-cols-2">
        <FormField label="Region" number="1">
          <TextInput
            value={form.region || SARANGANI_REGION}
            readOnly
            className="bg-zinc-50"
          />
        </FormField>
        <FormField label="Province" number="2">
          <SelectInput
            value={form.province || SARANGANI_PROVINCE}
            onChange={(e) => updateField("province", e.target.value)}
            options={[{ value: SARANGANI_PROVINCE, label: SARANGANI_PROVINCE }]}
            placeholder={SARANGANI_PROVINCE}
          />
        </FormField>
        <FormField label="City/Municipality" number="3">
          <SelectInput
            value={form.city_municipality}
            onChange={(e) => handleLocationMunicipality(e.target.value)}
            options={municipalityOptions()}
            placeholder="Select municipality"
          />
        </FormField>
        <FormField label="District" number="4">
          <TextInput
            value={form.district}
            onChange={(e) => updateField("district", e.target.value)}
          />
        </FormField>
        <FormField label="Barangay" number="5">
          <SelectInput
            value={form.barangay}
            onChange={(e) => handleLocationBarangay(e.target.value)}
            options={barangayOptions(form.city_municipality)}
            placeholder={
              form.city_municipality ? "Select barangay" : "Select municipality first"
            }
            disabled={!form.city_municipality}
          />
        </FormField>
        <FormField label="In Evacuation Center?" number="6" required className="sm:col-span-2">
          <RadioGroup
            name="evacuation_center"
            options={[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
            ]}
            value={form.evacuation_center_status}
            onChange={(v) => handleEvacuationStatus(v as "" | "yes" | "no")}
          />
        </FormField>
        {form.evacuation_center_status === "yes" && (
          <FormField label="Evacuation Center/Site" required className="sm:col-span-2">
            <TextInput
              value={form.evacuation_center_site}
              onChange={(e) => updateField("evacuation_center_site", e.target.value)}
              placeholder="Name of evacuation center or site"
            />
          </FormField>
        )}
      </div>

      {/* Head of Family */}
      <SectionHeader title="Head of the Family" />
      <div className="faced-section-body grid gap-3 sm:grid-cols-2">
        <FormField label="Last Name" number="7">
          <TextInput
            value={form.head_of_family.last_name}
            onChange={(e) => updateHead("last_name", e.target.value)}
          />
        </FormField>
        <FormField label="First Name" number="8">
          <TextInput
            value={form.head_of_family.first_name}
            onChange={(e) => updateHead("first_name", e.target.value)}
          />
        </FormField>
        <FormField label="Middle Name" number="9">
          <TextInput
            value={form.head_of_family.middle_name}
            onChange={(e) => updateHead("middle_name", e.target.value)}
          />
        </FormField>
        <FormField label="Name Extension" number="10">
          <SelectInput
            value={form.head_of_family.name_extension}
            onChange={(e) => updateHead("name_extension", e.target.value)}
            options={NAME_EXTENSIONS}
            placeholder="None"
          />
        </FormField>
        <FormField label="Birthdate" number="11">
          <TextInput
            type="date"
            value={form.head_of_family.birthdate}
            onChange={(e) => handleHeadBirthdate(e.target.value)}
          />
        </FormField>
        <FormField label="Age" number="12">
          <TextInput
            type="number"
            min={0}
            max={150}
            value={form.head_of_family.age}
            onChange={(e) => updateHead("age", e.target.value)}
          />
        </FormField>
        <FormField label="Birthplace" number="13">
          <TextInput
            value={form.head_of_family.birthplace}
            onChange={(e) => updateHead("birthplace", e.target.value)}
          />
        </FormField>
        <FormField label="Sex" number="14" required>
          <RadioGroup
            name="head_sex"
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
            value={form.head_of_family.sex}
            onChange={handleSexChange}
          />
        </FormField>
        <FormField label="Civil Status" number="15" required>
          <SelectInput
            value={form.head_of_family.civil_status}
            onChange={(e) => updateHead("civil_status", e.target.value)}
            options={CIVIL_STATUS}
            placeholder="Select civil status"
          />
        </FormField>
        <FormField label="Mother's Maiden Name" number="16">
          <TextInput
            value={form.head_of_family.mothers_maiden_name}
            onChange={(e) => updateHead("mothers_maiden_name", e.target.value)}
          />
        </FormField>
        <FormField label="Occupation" number="17" required className="sm:col-span-2">
          <TextInput
            value={form.head_of_family.occupation}
            onChange={(e) => updateHead("occupation", e.target.value)}
            placeholder="Occupation"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {OCCUPATION_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => updateHead("occupation", suggestion)}
                className="faced-chip"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </FormField>
        <FormField label="Monthly Family Net Income" number="18">
          <TextInput
            value={form.head_of_family.monthly_family_net_income}
            onChange={(e) => updateHead("monthly_family_net_income", e.target.value)}
            type="number"
            min="0"
          />
        </FormField>
        <FormField label="ID Card Presented" number="19">
          <TextInput
            value={form.head_of_family.id_card_presented}
            onChange={(e) => updateHead("id_card_presented", e.target.value)}
            placeholder="NATIONAL ID, Driver's License, etc."
          />
        </FormField>
        <FormField label="ID Card Number" number="20">
          <TextInput
            value={form.head_of_family.id_card_number}
            onChange={(e) => updateHead("id_card_number", e.target.value)}
          />
        </FormField>
        <FormField label="Contact Number (Primary)" number="21">
          <TextInput
            value={form.head_of_family.contact_number.primary}
            onChange={(e) =>
              updateHead("contact_number", {
                ...form.head_of_family.contact_number,
                primary: e.target.value,
              })
            }
            type="tel"
          />
        </FormField>
        <FormField label="Contact Number (Alternate)">
          <TextInput
            value={form.head_of_family.contact_number.alternate}
            onChange={(e) =>
              updateHead("contact_number", {
                ...form.head_of_family.contact_number,
                alternate: e.target.value,
              })
            }
            type="tel"
          />
        </FormField>
      </div>

      {/* Permanent Address */}
      <SectionHeader title="Permanent Address" number="22" />
      <div className="faced-section-body grid gap-3 sm:grid-cols-2">
        <FormField
          label="House/Block/Lot, Street, Subdivision/Village"
          className="sm:col-span-2"
        >
          <TextInput
            value={form.permanent_address.address_line}
            onChange={(e) => updateAddress("address_line", e.target.value)}
            placeholder="e.g. Purok Tamparan, Main Street, Village Name"
          />
        </FormField>
        <FormField label="City/Municipality">
          <SelectInput
            value={form.permanent_address.city_municipality}
            onChange={(e) => handlePermMunicipality(e.target.value)}
            options={municipalityOptions()}
            placeholder="Select municipality"
          />
        </FormField>
        <FormField label="Barangay">
          <SelectInput
            value={form.permanent_address.barangay}
            onChange={(e) => updateAddress("barangay", e.target.value)}
            options={barangayOptions(form.permanent_address.city_municipality)}
            placeholder={
              form.permanent_address.city_municipality
                ? "Select barangay"
                : "Select municipality first"
            }
            disabled={!form.permanent_address.city_municipality}
          />
        </FormField>
        <FormField label="Province">
          <SelectInput
            value={form.permanent_address.province || SARANGANI_PROVINCE}
            onChange={(e) => updateAddress("province", e.target.value)}
            options={[{ value: SARANGANI_PROVINCE, label: SARANGANI_PROVINCE }]}
            placeholder={SARANGANI_PROVINCE}
          />
        </FormField>
        <FormField label="Zip Code">
          <TextInput
            value={form.permanent_address.zip_code}
            onChange={(e) => updateAddress("zip_code", e.target.value)}
          />
        </FormField>
      </div>

      {/* Others */}
      <SectionHeader title="Others" />
      <div className="faced-section-body space-y-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.others["4ps_beneficiary"]}
            onChange={(e) =>
              updateField("others", {
                ...form.others,
                "4ps_beneficiary": e.target.checked,
              })
            }
            className="h-4 w-4 accent-[var(--faced-blue)]"
          />
          4Ps Beneficiary
        </label>
        <FormField label="IP (Type of Ethnicity)">
          <TextInput
            value={form.others.ip_type_of_ethnicity}
            onChange={(e) =>
              updateField("others", {
                ...form.others,
                ip_type_of_ethnicity: e.target.value,
              })
            }
          />
        </FormField>
      </div>

      {/* Family Members */}
      <SectionHeader title="Family Information (Required)" number="25" />
      <div className="faced-section-body space-y-4">
        <div className="overflow-x-auto">
          <table className="faced-table w-full min-w-[720px] text-sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Relation</th>
                <th>Birthdate</th>
                <th>Age</th>
                <th>Sex</th>
                <th>Education</th>
                <th>Occupation</th>
                <th>Vulnerability</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.family_members.map((member, index) => (
                <tr key={index}>
                  <td>
                    <TextInput
                      value={member.family_member_name}
                      onChange={(e) =>
                        updateMember(index, "family_member_name", e.target.value)
                      }
                      className="min-w-[120px]"
                    />
                  </td>
                  <td>
                    <SelectInput
                      value={member.relationship_to_family_head}
                      onChange={(e) =>
                        updateMember(index, "relationship_to_family_head", e.target.value)
                      }
                      options={relationOptions()}
                      placeholder="Select"
                      className="min-w-[140px]"
                    />
                  </td>
                  <td>
                    <TextInput
                      type="date"
                      value={member.birthdate}
                      onChange={(e) => updateMember(index, "birthdate", e.target.value)}
                      className="min-w-[130px]"
                    />
                  </td>
                  <td>
                    <TextInput
                      type="number"
                      min={0}
                      max={150}
                      value={member.age}
                      onChange={(e) => updateMember(index, "age", e.target.value)}
                      className="w-16"
                    />
                  </td>
                  <td>
                    <SelectInput
                      value={member.sex}
                      onChange={(e) => updateMember(index, "sex", e.target.value)}
                      options={SEX_OPTIONS}
                      className="w-16"
                    />
                  </td>
                  <td>
                    <TextInput
                      value={member.highest_educational_attainment}
                      onChange={(e) =>
                        updateMember(index, "highest_educational_attainment", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <TextInput
                      value={member.occupation}
                      onChange={(e) => updateMember(index, "occupation", e.target.value)}
                    />
                  </td>
                  <td>
                    <SelectInput
                      value={member.type_of_vulnerability}
                      onChange={(e) =>
                        updateMember(index, "type_of_vulnerability", e.target.value)
                      }
                      options={vulnerabilityOptions()}
                      placeholder="None"
                      className="min-w-[110px]"
                    />
                  </td>
                  <td>
                    {form.family_members.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addMember}
          className="text-sm font-medium text-[var(--faced-blue)] hover:underline"
        >
          + Add family member
        </button>
      </div>

      {/* Account Information */}
      <SectionHeader title="Account Information" />
      <div className="faced-section-body grid gap-3 sm:grid-cols-2">
        <FormField label="Bank/E-Wallet Name" number="26">
          <TextInput
            value={form.account_information.bank_e_wallet_name}
            onChange={(e) =>
              updateField("account_information", {
                ...form.account_information,
                bank_e_wallet_name: e.target.value,
              })
            }
          />
        </FormField>
        <FormField label="Account Type" number="27">
          <TextInput
            value={form.account_information.account_type}
            onChange={(e) =>
              updateField("account_information", {
                ...form.account_information,
                account_type: e.target.value,
              })
            }
          />
        </FormField>
        <FormField label="Account Name" number="28">
          <TextInput
            value={form.account_information.account_name}
            onChange={(e) =>
              updateField("account_information", {
                ...form.account_information,
                account_name: e.target.value,
              })
            }
          />
        </FormField>
        <FormField label="Account Number" number="29">
          <TextInput
            value={form.account_information.account_number}
            onChange={(e) =>
              updateField("account_information", {
                ...form.account_information,
                account_number: e.target.value,
              })
            }
          />
        </FormField>
      </div>

      {/* House Ownership */}
      <SectionHeader title="House Ownership (Required)" number="30" />
      <div className="faced-section-body">
        <CheckboxGroup
          exclusive
          options={[
            { key: "owner", label: "Owner" },
            { key: "renter", label: "Renter" },
            { key: "sharer", label: "Sharer" },
          ]}
          values={form.house_ownership}
          onChange={(key, checked) =>
            updateField("house_ownership", {
              owner: key === "owner" ? checked : false,
              renter: key === "renter" ? checked : false,
              sharer: key === "sharer" ? checked : false,
            })
          }
        />
      </div>

      {/* Shelter Damage */}
      <SectionHeader title="Shelter Damage Classification (Required)" number="31" />
      <div className="faced-section-body">
        <CheckboxGroup
          exclusive
          options={[
            { key: "partially_damaged", label: "Partially Damaged" },
            { key: "totally_damaged", label: "Totally Damaged" },
          ]}
          values={form.shelter_damage_classification}
          onChange={(key, checked) =>
            updateField("shelter_damage_classification", {
              partially_damaged: key === "partially_damaged" ? checked : false,
              totally_damaged: key === "totally_damaged" ? checked : false,
            })
          }
        />
      </div>

      <SectionHeader title="Date Registered" />
      <div className="faced-section-body">
        <FormField label="Date Registered">
          <TextInput
            type="date"
            value={toDateInputValue(form.date_registered)}
            onChange={(e) => updateField("date_registered", e.target.value)}
          />
        </FormField>
      </div>

      {/* Privacy Declaration */}
      <div className="faced-section-body border-t border-[var(--faced-blue-border)] bg-[var(--ph-blue-light)]/50 p-4">
        <p className="mb-3 text-xs leading-relaxed text-zinc-700">
          <strong>Data Privacy Declaration:</strong> I hereby declare that the
          information provided is true and correct. I understand that any false
          information may result in disqualification from assistance. I consent
          to the collection and processing of my personal data in accordance with
          Republic Act No. 10173 (Data Privacy Act of 2012).
        </p>
        <label className="flex cursor-pointer items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.privacy_declaration_acknowledged}
            onChange={(e) =>
              updateField("privacy_declaration_acknowledged", e.target.checked)
            }
            className="mt-0.5 h-4 w-4 accent-[var(--faced-blue)]"
            required
          />
          I acknowledge and agree to the Data Privacy Declaration
        </label>
      </div>

      {/* Actions */}
      <div className="faced-section-body flex flex-wrap gap-3 border-t border-[var(--faced-blue-border)] pt-4">
        <button type="submit" disabled={saving} className="faced-btn-primary">
          {saving ? "Saving..." : editId ? "Update record" : "Save FACED record"}
        </button>
        {editId && onCancelEdit && (
          <button type="button" onClick={onCancelEdit} className="faced-btn-secondary">
            Cancel edit
          </button>
        )}
      </div>

      {message && (
        <p
          className={`px-4 pb-4 text-sm ${message.includes("saved") || message.includes("updated") ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  );
}
