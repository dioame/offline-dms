"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ExternalLink, Loader2, Pencil, Save } from "lucide-react";
import FacedRecordViewModal from "@/components/records/FacedRecordViewModal";
import { getFacedRecordByUuid } from "@/lib/db";
import type { FamilyMember } from "@/lib/faced-types";
import { SARANGANI_PROVINCE } from "@/lib/sarangani-locations";
import type { FacedRecordAdminDetail } from "@/lib/records-admin";
import { resolveDuplicateMatchRecord } from "@/lib/resolve-duplicate-record";
import { type VerifyMatch } from "@/lib/verify-match";
import * as ui from "@/lib/ui";
import { cn } from "@/lib/cn";

type DuplicateConfirmDialogProps = {
  open: boolean;
  matches: VerifyMatch[];
  source: "online" | "offline" | "local" | null;
  saving: boolean;
  intent: "detect" | "save";
  onDismiss: () => void;
  onGoBack: () => void;
  onContinue: () => void;
  onEditLocalRecord?: (id: number) => void;
};

const PREVIEW_MEMBER_LIMIT = 5;

function sourceLabel(source: DuplicateConfirmDialogProps["source"]): string {
  if (source === "online") return "synced online records";
  if (source === "offline") return "your downloaded offline copy";
  if (source === "local") return "records saved on this device";
  return "available records";
}

function listedFamilyMembers(record: FacedRecordAdminDetail): FamilyMember[] {
  return record.family_members.filter(
    (member) =>
      member.family_member_name.trim() ||
      member.relationship_to_family_head.trim() ||
      member.birthdate.trim(),
  );
}

function memberPreviewLabel(member: FamilyMember, index: number): string {
  return member.family_member_name.trim() || `Member ${index + 1}`;
}

function memberPreviewMeta(member: FamilyMember): string {
  const relationship = member.relationship_to_family_head.trim();
  const birthdate = member.birthdate.trim();
  const age = member.age.trim();
  const sex = member.sex.trim();
  const parts = [
    relationship,
    birthdate,
    age ? `${age} yrs` : "",
    sex,
  ].filter(Boolean);
  return parts.join(" · ") || "—";
}

function memberPreviewGridClass(count: number): string {
  const columns = Math.min(Math.max(count, 1), 4);
  const columnClass: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  return cn(ui.duplicateMemberPreviewList, columnClass[columns]);
}

function HeadDetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[5.5rem] flex-1">
      <p className={ui.duplicateHeadDetailLabel}>{label}</p>
      <p className={ui.duplicateHeadDetailValue}>{value}</p>
    </div>
  );
}

function FamilyMemberPreviewList({
  members,
  hiddenCount,
}: {
  members: FamilyMember[];
  hiddenCount: number;
}) {
  return (
    <>
      <div className={memberPreviewGridClass(members.length)}>
        {members.map((member, index) => (
          <div
            key={`${memberPreviewLabel(member, index)}-${index}`}
            className={ui.duplicateMemberPreviewItem}
          >
            <span className={ui.duplicateMemberPreviewName}>
              {memberPreviewLabel(member, index)}
            </span>
            <span className={ui.duplicateMemberPreviewMeta}>{memberPreviewMeta(member)}</span>
          </div>
        ))}
      </div>
      {hiddenCount > 0 ? (
        <p className="px-1 py-0.5 text-[0.6875rem] text-zinc-500">
          +{hiddenCount} more — view full details
        </p>
      ) : null}
    </>
  );
}

type DuplicateMatchCardProps = {
  match: VerifyMatch;
  record: FacedRecordAdminDetail | null;
  loading: boolean;
  onViewDetails: (match: VerifyMatch) => void;
  onEdit: (match: VerifyMatch) => void;
};

function DuplicateMatchCard({
  match,
  record,
  loading,
  onViewDetails,
  onEdit,
}: DuplicateMatchCardProps) {
  const members = record ? listedFamilyMembers(record) : [];
  const previewMembers = members.slice(0, PREVIEW_MEMBER_LIMIT);
  const hiddenCount = Math.max(0, members.length - previewMembers.length);
  const location =
    [match.barangay, match.cityMunicipality, SARANGANI_PROVINCE].filter(Boolean).join(", ") ||
    "—";

  return (
    <li className={ui.verifyMatchCard}>
      <div className="border-b border-faced-blue-border bg-gradient-to-r from-ph-blue-light to-white px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-wrap items-start gap-3 sm:gap-4">
          <div className="min-w-[7rem] shrink-0 sm:min-w-[9rem]">
            <p className="text-base font-bold uppercase leading-snug text-ph-blue-dark sm:text-lg">
              {match.headName}
            </p>
            <p className="mt-1 text-[0.6875rem] font-semibold uppercase tracking-wide text-amber-800 sm:text-xs">
              {match.matchLabel}
            </p>
          </div>

          <div className="flex min-w-0 flex-1 flex-wrap items-start gap-x-4 gap-y-2 sm:gap-x-5">
            <HeadDetailItem label="Birthdate" value={match.birthdate || "—"} />
            <HeadDetailItem label="Location" value={location} />
            <HeadDetailItem label="Registered" value={match.dateRegistered || "—"} />
          </div>

          <span className={cn(ui.verifyMatchBadge, "shrink-0")}>Match</span>
        </div>
      </div>

      <div className="px-4 py-2.5 sm:px-5 sm:py-3">
        <p className="text-[0.6875rem] font-bold uppercase tracking-wider text-zinc-500">
          Family members
          {members.length > 0 ? ` (${members.length})` : ""}
        </p>

        {loading ? (
          <div className={cn(ui.withIcon, "mt-2 text-xs text-zinc-500")}>
            <Loader2 className={cn(ui.iconSm, "animate-spin")} aria-hidden />
            Loading family preview…
          </div>
        ) : !record ? (
          <p className="mt-2 text-xs text-zinc-500">
            Family preview unavailable offline. Connect to load member details.
          </p>
        ) : members.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">No family members recorded.</p>
        ) : (
          <div className="mt-2">
            <FamilyMemberPreviewList members={previewMembers} hiddenCount={hiddenCount} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-faced-blue-border bg-zinc-50 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:px-5">
        <button
          type="button"
          onClick={() => onViewDetails(match)}
          className={cn(ui.btnSecondary, ui.withIcon, "w-full text-sm sm:w-auto")}
        >
          <ExternalLink className={ui.iconSm} aria-hidden />
          View full details
        </button>
        <button
          type="button"
          onClick={() => onEdit(match)}
          className={cn(ui.btnSecondary, ui.withIcon, "w-full text-sm sm:w-auto")}
        >
          <Pencil className={ui.iconSm} aria-hidden />
          Edit family details
        </button>
      </div>
    </li>
  );
}

export default function DuplicateConfirmDialog({
  open,
  matches,
  source,
  saving,
  intent,
  onDismiss,
  onGoBack,
  onContinue,
  onEditLocalRecord,
}: DuplicateConfirmDialogProps) {
  const router = useRouter();
  const [recordsByUuid, setRecordsByUuid] = useState<Record<string, FacedRecordAdminDetail>>({});
  const [loadingUuids, setLoadingUuids] = useState<Record<string, boolean>>({});
  const [detailMatch, setDetailMatch] = useState<VerifyMatch | null>(null);
  const [detailRecord, setDetailRecord] = useState<FacedRecordAdminDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const matchUuids = matches.map((match) => match.uuid).join("|");

  useEffect(() => {
    if (!open) {
      setRecordsByUuid({});
      setLoadingUuids({});
      return;
    }

    let cancelled = false;

    for (const match of matches) {
      setLoadingUuids((prev) => ({ ...prev, [match.uuid]: true }));

      void resolveDuplicateMatchRecord(match.uuid)
        .then((record) => {
          if (cancelled) return;
          if (record) {
            setRecordsByUuid((prev) => ({ ...prev, [match.uuid]: record }));
          }
        })
        .finally(() => {
          if (cancelled) return;
          setLoadingUuids((prev) => {
            const next = { ...prev };
            delete next[match.uuid];
            return next;
          });
        });
    }

    return () => {
      cancelled = true;
    };
  }, [open, matchUuids, matches]);

  const closeDetail = useCallback(() => {
    setDetailMatch(null);
    setDetailRecord(null);
    setDetailLoading(false);
    setDetailError(null);
  }, []);

  const loadRecord = useCallback(async (uuid: string) => {
    const cached = recordsByUuid[uuid];
    if (cached) return cached;

    const record = await resolveDuplicateMatchRecord(uuid);
    if (record) {
      setRecordsByUuid((prev) => ({ ...prev, [uuid]: record }));
    }
    return record;
  }, [recordsByUuid]);

  const openDetail = useCallback(async (match: VerifyMatch) => {
    setDetailMatch(match);
    setDetailRecord(null);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const record = await loadRecord(match.uuid);
      if (!record) {
        setDetailError(
          "Full record details are not available offline for this match. Connect to the internet and try again.",
        );
        return;
      }
      setDetailRecord(record);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : "Could not load record details.");
    } finally {
      setDetailLoading(false);
    }
  }, [loadRecord]);

  const handleEdit = useCallback(
    async (match: VerifyMatch) => {
      const local = await getFacedRecordByUuid(match.uuid);
      if (local?.id && onEditLocalRecord) {
        onEditLocalRecord(local.id);
        onDismiss();
        return;
      }

      router.push(`/records/${match.uuid}/edit`);
    },
    [onDismiss, onEditLocalRecord, router],
  );

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/45 p-0 sm:items-center sm:p-4" role="presentation" onClick={onDismiss}>
        <div
          className={cn(
            ui.modalWide,
            ui.duplicateConfirmUppercase,
            "flex max-h-[92dvh] w-full flex-col rounded-t-xl sm:max-h-[90vh] sm:rounded-xl",
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-confirm-title"
          onClick={(event) => event.stopPropagation()}
        >
          <div className={cn(ui.modalHeader, ui.modalHeaderWarning, ui.withIcon, "shrink-0")}>
            <AlertTriangle className={ui.iconMd} aria-hidden />
            <h3 id="duplicate-confirm-title">Possible duplicate found</h3>
          </div>
          <div className={cn(ui.modalBody, "min-h-0 flex-1 overflow-y-auto")}>
            <p className="text-sm text-zinc-700">
              {matches.length === 1
                ? "A matching beneficiary was found"
                : `${matches.length} matching beneficiaries were found`}{" "}
              in {sourceLabel(source)}.
              {intent === "detect"
                ? " Review each match below before continuing."
                : " Continue only if you have confirmed this is not a duplicate."}
            </p>

            <ul className="mt-4 space-y-3">
              {matches.map((match) => (
                <DuplicateMatchCard
                  key={match.uuid}
                  match={match}
                  record={recordsByUuid[match.uuid] ?? null}
                  loading={Boolean(loadingUuids[match.uuid])}
                  onViewDetails={(selected) => void openDetail(selected)}
                  onEdit={(selected) => void handleEdit(selected)}
                />
              ))}
            </ul>
          </div>
          <div className={cn(ui.modalActions, "shrink-0 flex-col sm:flex-row sm:justify-end")}>
            <button
              type="button"
              onClick={onGoBack}
              disabled={saving}
              className={cn(ui.btnSecondary, ui.withIcon, "w-full sm:w-auto")}
            >
              <ArrowLeft className={ui.iconSm} aria-hidden />
              Go back
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={saving}
              className={cn(ui.btnPrimary, ui.withIcon, "w-full sm:w-auto")}
            >
              <Save className={ui.iconSm} aria-hidden />
              {saving
                ? "Saving..."
                : intent === "save"
                  ? "Save anyway"
                  : "Continue encoding"}
            </button>
          </div>
        </div>
      </div>

      {detailMatch ? (
        <FacedRecordViewModal
          elevated
          showEdit
          loading={detailLoading}
          record={detailRecord}
          error={detailError}
          onClose={closeDetail}
          onEdit={() => {
            void handleEdit(detailMatch);
            closeDetail();
          }}
        />
      ) : null}
    </>
  );
}
