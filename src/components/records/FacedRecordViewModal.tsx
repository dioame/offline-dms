"use client";

import type { FamilyMember } from "@/lib/faced-types";
import {
  houseOwnershipRadioValue,
  mergePermanentAddressLine,
  shelterDamageRadioValue,
} from "@/lib/faced-types";
import { resolveFacedSerialNumber } from "@/lib/faced-serial";
import type { FacedRecordAdminDetail } from "@/lib/records-admin";
import { FileText, Pencil, X } from "lucide-react";
import { SkeletonRecordView, SkeletonScreen } from "@/components/ui/Skeleton";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type FacedRecordViewModalProps = {
  record: FacedRecordAdminDetail | null;
  loading?: boolean;
  error?: string | null;
  showEdit?: boolean;
  elevated?: boolean;
  onClose: () => void;
  onEdit?: () => void;
};

const detailGrid =
  "grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

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
      <span className={ui.label}>{label}</span>
      <span className="mt-0.5 block text-zinc-900">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="border-b border-faced-blue-border pb-1 text-xs font-bold uppercase tracking-wide text-ph-blue-dark">
      {children}
    </h4>
  );
}

export default function FacedRecordViewModal({
  record,
  loading = false,
  error = null,
  showEdit = true,
  elevated = false,
  onClose,
  onEdit,
}: FacedRecordViewModalProps) {
  const head = record?.head_of_family;
  const address = record ? mergePermanentAddressLine(record.permanent_address) : "";
  const members =
    record?.family_members.filter(
      (member) =>
        member.family_member_name.trim() ||
        member.relationship_to_family_head.trim() ||
        member.birthdate.trim(),
    ) ?? [];

  return (
    <div
      className={cn(ui.modalBackdropFullscreen, elevated && "z-[60]")}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={ui.modalFullscreen}
        role="dialog"
        aria-modal="true"
        aria-labelledby="faced-record-view-title"
        aria-busy={loading}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className={cn(
            ui.modalHeader,
            ui.modalHeaderInfo,
            "flex shrink-0 items-center justify-start gap-2 px-5 py-4",
          )}
        >
          <FileText className={ui.iconMd} aria-hidden />
          <div className="min-w-0">
            <h3 id="faced-record-view-title" className="text-base">
              FACED record details
            </h3>
            {loading ? (
              <p className="mt-1 text-xs font-normal text-white/85">Loading record…</p>
            ) : record ? (
              <p className="mt-1 truncate text-xs font-normal uppercase text-white/85">
                {headFullName(record)}
              </p>
            ) : null}
          </div>
        </div>

        <div className={cn(ui.modalBody, "min-h-0 flex-1 overflow-y-auto px-5 py-5 text-sm")}>
          {loading ? (
            <SkeletonScreen label="Loading FACED record details">
              <SkeletonRecordView />
            </SkeletonScreen>
          ) : error ? (
            <div className={ui.alertError}>{error}</div>
          ) : !record || !head ? (
            <div className={ui.alertWarning}>Record details are not available.</div>
          ) : (
            <div className="space-y-6">
              <section className="space-y-3">
                <SectionTitle>Record information</SectionTitle>
                <div className={detailGrid}>
                  <DetailItem label="UUID" value={record.uuid} />
                  <DetailItem
                    label="Serial number"
                    value={resolveFacedSerialNumber(record)}
                  />
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
                <div className={detailGrid}>
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
                  <DetailItem label="ID presented" value={displayValue(head.id_card_presented)} />
                  <DetailItem label="ID number" value={displayValue(head.id_card_number)} />
                  <DetailItem
                    label="Contact (primary)"
                    value={displayValue(head.contact_number.primary)}
                  />
                  <DetailItem
                    label="Contact (alternate)"
                    value={displayValue(head.contact_number.alternate)}
                  />
                  <DetailItem
                    label="Ethnicity"
                    value={displayValue(record.others.ip_type_of_ethnicity)}
                  />
                  <DetailItem label="Religion" value={displayValue(record.others.religion)} />
                  <DetailItem
                    label="4Ps beneficiary"
                    value={record.others["4ps_beneficiary"] ? "Yes" : "No"}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <SectionTitle>Address &amp; household</SectionTitle>
                <div className={detailGrid}>
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
                          ? displayValue(record.evacuation_center_site || "No")
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
                <SectionTitle>Family members ({members.length})</SectionTitle>
                {members.length === 0 ? (
                  <p className="text-sm text-zinc-500">No family members recorded.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-faced-blue-border">
                    <table className={cn(ui.table, "w-full min-w-[960px] text-sm")}>
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
          )}
        </div>

        <div className={cn(ui.modalActions, "shrink-0 px-5")}>
          <button type="button" onClick={onClose} className={cn(ui.btnSecondary, ui.withIcon)}>
            <X className={ui.iconSm} aria-hidden />
            Close
          </button>
          {showEdit && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              disabled={loading || !record}
              className={cn(
                ui.btnPrimary,
                ui.withIcon,
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <Pencil className={ui.iconSm} aria-hidden />
              Edit record
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
