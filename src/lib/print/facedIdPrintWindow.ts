import type { FacedIdCardData } from "./faced-id-print-types";

export const FACED_ID_PRINT_PREFIX = "facedIdPrint:";
const JOB_TTL_MS = 60 * 60 * 1000;

export type FacedIdPrintPayload = {
  cards: FacedIdCardData[];
  title?: string;
  createdAt?: number;
};

function storageKey(jobId: string) {
  return `${FACED_ID_PRINT_PREFIX}${jobId}`;
}

let printJobCounter = 0;

function newPrintJobId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  printJobCounter += 1;
  return `faced-id-${Date.now()}-${printJobCounter}-${Math.random().toString(36).slice(2, 11)}`;
}

function cleanupOldPrintJobs() {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (let i = localStorage.length - 1; i >= 0; i -= 1) {
    const key = localStorage.key(i);
    if (!key?.startsWith(FACED_ID_PRINT_PREFIX)) continue;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || "") as FacedIdPrintPayload;
      if ((parsed.createdAt ?? 0) < cutoff) {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }
}

export function storeFacedIdPrintPayload(payload: FacedIdPrintPayload): string {
  cleanupOldPrintJobs();
  const jobId = newPrintJobId();
  const record: FacedIdPrintPayload = {
    ...payload,
    createdAt: Date.now(),
  };
  localStorage.setItem(storageKey(jobId), JSON.stringify(record));
  return jobId;
}

export function loadFacedIdPrintPayload(jobId?: string | null): FacedIdPrintPayload | null {
  if (!jobId) return null;
  try {
    const raw = localStorage.getItem(storageKey(jobId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FacedIdPrintPayload;
    if (!parsed?.cards?.length) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFacedIdPrintPayload(jobId?: string | null) {
  if (jobId) {
    localStorage.removeItem(storageKey(jobId));
  }
}

export function facedIdPrintUrl(jobId: string): string {
  return `${window.location.origin}/print/faced-id?job=${encodeURIComponent(jobId)}`;
}

export function openFacedIdPrintWindow(payload: FacedIdPrintPayload): Window | null {
  const jobId = storeFacedIdPrintPayload(payload);
  const url = facedIdPrintUrl(jobId);
  const printWindow = window.open(url, "_blank");
  if (!printWindow) {
    clearFacedIdPrintPayload(jobId);
  }
  return printWindow;
}
