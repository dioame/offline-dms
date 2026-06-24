import type { FamilyHead, FamilyMember } from "./faced-print-types";

export const FACED_ANNEX_PRINT_PREFIX = "facedAnnexPrint:";
const JOB_TTL_MS = 60 * 60 * 1000;

export type FacedAnnexPrintPayload = {
  heads: FamilyHead[];
  membersByHead: Record<string, FamilyMember[]>;
  title?: string;
  createdAt?: number;
};

export function serializeMembersByHead(
  map: Map<string, FamilyMember[]>,
): Record<string, FamilyMember[]> {
  const out: Record<string, FamilyMember[]> = {};
  map.forEach((members, key) => {
    out[key] = members;
  });
  return out;
}

export function membersMapFromRecord(
  record: Record<string, FamilyMember[]>,
): Map<string, FamilyMember[]> {
  return new Map(Object.entries(record));
}

function storageKey(jobId: string) {
  return `${FACED_ANNEX_PRINT_PREFIX}${jobId}`;
}

let printJobCounter = 0;

function newPrintJobId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  printJobCounter += 1;
  return `print-${Date.now()}-${printJobCounter}-${Math.random().toString(36).slice(2, 11)}`;
}

function cleanupOldPrintJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(FACED_ANNEX_PRINT_PREFIX)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "") as FacedAnnexPrintPayload;
      if ((parsed.createdAt ?? 0) < cutoff) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

export function storeFacedAnnexPrintPayload(payload: FacedAnnexPrintPayload): string {
  cleanupOldPrintJobs();
  const jobId = newPrintJobId();
  const record: FacedAnnexPrintPayload = {
    ...payload,
    createdAt: Date.now(),
  };
  localStorage.setItem(storageKey(jobId), JSON.stringify(record));
  return jobId;
}

export function loadFacedAnnexPrintPayload(jobId?: string | null): FacedAnnexPrintPayload | null {
  if (!jobId) return null;
  try {
    const raw = localStorage.getItem(storageKey(jobId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FacedAnnexPrintPayload;
    if (!parsed?.heads?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFacedAnnexPrintPayload(jobId?: string | null) {
  if (jobId) {
    localStorage.removeItem(storageKey(jobId));
  }
}

export function facedAnnexPrintUrl(jobId: string): string {
  return `${window.location.origin}/print/faced-annex?job=${encodeURIComponent(jobId)}`;
}

export function openFacedAnnexPrintWindow(payload: FacedAnnexPrintPayload): Window | null {
  const jobId = storeFacedAnnexPrintPayload(payload);
  const url = facedAnnexPrintUrl(jobId);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    clearFacedAnnexPrintPayload(jobId);
  }
  return printWindow;
}
