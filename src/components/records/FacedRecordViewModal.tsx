"use client";

import type { FamilyMember } from "@/lib/faced-types";
import {
  houseOwnershipRadioValue,
  mergePermanentAddressLine,
  shelterDamageRadioValue,
} from "@/lib/faced-types";
import type { FacedRecordAdminDetail } from "@/lib/records-admin";

type FacedRecordViewModalProps = {
  record: FacedRecordAdminDetail;
  onClose: () => void;
  onEdit: () => void;
};

function formatWhen(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function displayValue(value: string | undefined): string {
  return value?.trim() || "—";
}

function displaySex(sex: string): string {
  const normalized = sex.trim().toUpperCase();
  if (normalized === "M" || normalized === "MALE") return "Male";
  if (normalized === "F" || normalized === "FEMALE") return "Female";
  return displayValue(sex);
}

function headFullName(record: FacedRecordAdminDetail): string {
  const head = record.head_of_family;
  return [
    head.first_name,
    head.middle_name,
    head.last_name,
    head.name_extension,
  ]
    .filter(Boolean)
    .join(" ");
}

function memberLabel(member: FamilyMember, index: number): string {
  return member.family_member_name.trim() || `Member ${index + 1}`;
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="faced-label">{label}</span>
      <span className="mt-0.5 block text-zinc-900">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="border-b border-[var(--faced-blue-border)] pb-1 text-xs font-bold uppercase tracking-wide text-[var(--ph-blue-dark)]">
      {children}
    </h4>
  );
}

export default function FacedRecordViewModal({
  record,
  onClose,
  onEdit,
}: FacedRecordViewModalProps) {
  const head = record.head_of_family;
  const address = mergePermanentAddressLine(record.permanent_address);
  const members = record.family_members.filter(
    (member) =>
      member.family_member_name.trim() ||
      member.relationship_to_family_head.trim() ||
      member.birthdate.trim(),
  );

  return (
    <div className="faced-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="faced-modal faced-modal--large"
        role="dialog"
        aria-modal="true"
        aria-labelledby="faced-record-view-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="faced-modal-header" style={{ background: "var(--ph-blue-dark)" }}>
          <h3 id="faced-record-view-title">FACED record details</h3>
          <p className="mt-0.5 text-xs font-normal text-white/85">{headFullName(record)}</p>
        </div>

        <div className="faced-modal-body max-h-[78vh] space-y-5 overflow-y-auto text-sm">
          <section className="space-y-3">
            <SectionTitle>Record information</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="UUID" value={record.uuid} />
              <DetailItem label="Access code" value={displayValue(record.access_code)} />
              <DetailItem label="Encoder" value={displayValue(record.enumerator_name)} />
              <DetailItem label="Date registered" value={displayValue(record.date_registered)} />
              <DetailItem label="Last updated" value={formatWhen(record.updatedAt)} />
              <DetailItem
                label="Location"
                value={
                  [record.barangay, record.city_municipality, record.province]
                    .filter(Boolean)
                    .join(", ") || "—"
                }
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>Head of family</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Full name" value={headFullName(record)} />
              <DetailItem label="Birthdate" value={displayValue(head.birthdate)} />
              <DetailItem label="Age" value={displayValue(head.age)} />
              <DetailItem label="Sex" value={displaySex(head.sex)} />
              <DetailItem label="Birthplace" value={displayValue(head.birthplace)} />
              <DetailItem label="Civil status" value={displayValue(head.civil_status)} />
              <DetailItem label="Occupation" value={displayValue(head.occupation)} />
              <DetailItem
                label="Monthly family net income"
                value={displayValue(head.monthly_family_net_income)}
              />
              <DetailItem
                label="Mother's maiden name"
                value={displayValue(head.mothers_maiden_name)}
              />
              <DetailItem
                label="ID presented"
                value={displayValue(head.id_card_presented)}
              />
              <DetailItem label="ID number" value={displayValue(head.id_card_number)} />
              <DetailItem
                label="Contact (primary)"
                value={displayValue(head.contact_number.primary)}
              />
              <DetailItem
                label="Contact (alternate)"
                value={displayValue(head.contact_number.alternate)}
              />
              <DetailItem label="Ethnicity" value={displayValue(record.others.ip_type_of_ethnicity)} />
              <DetailItem label="Religion" value={displayValue(record.others.religion)} />
              <DetailItem
                label="4Ps beneficiary"
                value={record.others["4ps_beneficiary"] ? "Yes" : "No"}
              />
            </div>
          </section>

          <section className="space-y-3">
            <SectionTitle>Address &amp; household</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Permanent address" value={address || "—"} />
              <DetailItem
                label="Barangay"
                value={displayValue(record.permanent_address.barangay || record.barangay)}
              />
              <DetailItem
                label="City / municipality"
                value={displayValue(
                  record.permanent_address.city_municipality || record.city_municipality,
                )}
              />
              <DetailItem
                label="Evacuation center"
                value={
                  record.evacuation_center_status === "yes"
                    ? displayValue(record.evacuation_center_site || "Yes")
                    : record.evacuation_center_status === "no"
                      ? "No"
                      : "—"
                }
              />
              <DetailItem
                label="House ownership"
                value={displayValue(houseOwnershipRadioValue(record.house_ownership))}
              />
              <DetailItem
                label="Shelter damage"
                value={displayValue(
                  shelterDamageRadioValue(record.shelter_damage_classification),
                )}
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <SectionTitle>Family members ({members.length})</SectionTitle>
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-zinc-500">No family members recorded.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--faced-blue-border)]">
                <table className="faced-table w-full min-w-[960px] text-sm">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Relationship</th>
                      <th>Birthdate</th>
                      <th>Age</th>
                      <th>Sex</th>
                      <th>Education</th>
                      <th>Occupation</th>
                      <th>Vulnerability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, index) => (
                      <tr key={`${memberLabel(member, index)}-${index}`}>
                        <td>{index + 1}</td>
                        <td className="font-medium">{memberLabel(member, index)}</td>
                        <td>{displayValue(member.relationship_to_family_head)}</td>
                        <td>{displayValue(member.birthdate)}</td>
                        <td>{displayValue(member.age)}</td>
                        <td>{displaySex(member.sex)}</td>
                        <td>{displayValue(member.highest_educational_attainment)}</td>
                        <td>{displayValue(member.occupation)}</td>
                        <td>{displayValue(member.type_of_vulnerability)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <div className="faced-modal-actions">
          <button type="button" onClick={onClose} className="faced-btn-secondary">
            Close
          </button>
          <button type="button" onClick={onEdit} className="faced-btn-primary">
            Edit record
          </button>
        </div>
      </div>
    </div>
  );
}
