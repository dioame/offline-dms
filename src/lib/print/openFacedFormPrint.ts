import type { FamilyHead, FamilyMember } from "./faced-print-types";
import { downloadFacedAnnexPdf } from "./facedAnnexPdf";
import { openFacedAnnexPrintWindow, serializeMembersByHead } from "./facedAnnexPrintWindow";

export { buildFacedBatchPdfFilename } from "@/lib/batch-pdf/filename";

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

export async function downloadFacedFormPdf(
  heads: FamilyHead[],
  membersByHead: Map<string, FamilyMember[]>,
  pdfFilename: string,
  label?: string,
  options?: {
    container?: HTMLElement | null;
    onProgress?: (message: string) => void;
  },
): Promise<void> {
  if (!heads.length) {
    throw new Error("No FACED forms to download.");
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

  await downloadFacedAnnexPdf(
    {
      heads,
      membersByHead: serializeMembersByHead(membersByHead),
      title,
      pdfFilename,
      autoDownloadPdf: true,
    },
    options,
  );
}

export function membersMapForHead(
  head: FamilyHead,
  members: FamilyMember[],
): Map<string, FamilyMember[]> {
  const key = head.serial_code.trim().toUpperCase();
  return new Map([[key, members]]);
}
