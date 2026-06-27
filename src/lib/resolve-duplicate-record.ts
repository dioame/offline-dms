import { getAuthSession, getFacedRecordByUuid } from "./db";
import type { FacedRecord } from "./faced-types";
import type { FacedRecordAdminDetail } from "./records-admin";

function facedRecordToAdminDetail(record: FacedRecord): FacedRecordAdminDetail {
  return {
    ...record,
    sync_status: "synced",
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function resolveDuplicateMatchRecord(
  uuid: string,
): Promise<FacedRecordAdminDetail | null> {
  const trimmed = uuid.trim();
  if (!trimmed) return null;

  const local = await getFacedRecordByUuid(trimmed);
  if (local) return facedRecordToAdminDetail(local);

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return null;
  }

  const session = await getAuthSession();
  if (!session?.code || !session.sessionId) {
    return null;
  }

  const res = await fetch(`/api/encode/record/${encodeURIComponent(trimmed)}`, {
    headers: {
      "x-encode-code": session.code,
      "x-encode-session-id": session.sessionId,
    },
  });

  const data = (await res.json()) as { record?: FacedRecordAdminDetail; error?: string };
  if (!res.ok) {
    throw new Error(data.error || "Could not load record details.");
  }

  return data.record ?? null;
}
