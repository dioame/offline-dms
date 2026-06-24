import type { FamilyHead, FamilyMember } from "./faced-print-types";
import { openFacedAnnexPrintWindow, serializeMembersByHead } from "./facedAnnexPrintWindow";

export function openFacedFormPrint(
  heads: FamilyHead[],
  membersByHead: Map<string, FamilyMember[]>,
  label?: string,
): boolean {
  if (!heads.length) {
    return false;
  }

  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const title =
    label ??
    (heads.length === 1
      ? `FACED Form — ${heads[0].serial_code} — ${dateLabel}`
      : `FACED Form — ${heads.length} heads — ${dateLabel}`);

  const opened = openFacedAnnexPrintWindow({
    heads,
    membersByHead: serializeMembersByHead(membersByHead),
    title,
  });

  return opened !== null;
}

export function membersMapForHead(
  head: FamilyHead,
  members: FamilyMember[],
): Map<string, FamilyMember[]> {
  const key = head.serial_code.trim().toUpperCase();
  return new Map([[key, members]]);
}
