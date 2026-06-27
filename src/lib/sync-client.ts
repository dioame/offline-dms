import {
  getFacedRecordsByStatus,
  getFamilyAssistanceRecordsByStatus,
  markFacedRecordFailed,
  markFacedRecordSynced,
  markFamilyAssistanceFailed,
  markFamilyAssistanceSynced,
} from "./db";
import type { FacedRecord } from "./faced-types";
import type { FamilyAssistanceRecord } from "./family-assistance-types";
import { serializeFamilyAssistanceRecord } from "./family-assistance-types";

function toIso(value: Date | string | undefined): string {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

function serializeRecord(record: FacedRecord) {
  return {
    ...record,
    createdAt: toIso(record.createdAt),
    updatedAt: toIso(record.updatedAt),
  };
}

function serializeAssistanceRecord(record: FamilyAssistanceRecord) {
  return serializeFamilyAssistanceRecord(record);
}

type SyncApiResponse = {
  synced?: string[];
  failed?: { uuid: string; error: string }[];
  synced_assistance?: string[];
  failed_assistance?: { uuid: string; error: string }[];
  error?: string;
};

async function parseSyncResponse(response: Response): Promise<SyncApiResponse> {
  const text = await response.text();

  if (!text.trim()) {
    throw new Error(
      `Sync failed (${response.status}): empty response from server. Run npm run migrate and restart the dev server.`,
    );
  }

  try {
    return JSON.parse(text) as SyncApiResponse;
  } catch {
    const preview = text.replace(/\s+/g, " ").slice(0, 160);
    throw new Error(
      `Sync failed (${response.status}): server returned non-JSON. ${preview}`,
    );
  }
}

export type SyncResult = {
  synced: number;
  failed: number;
  errors?: string[];
};

export async function syncPendingRecords(): Promise<SyncResult> {
  const pending = await getFacedRecordsByStatus("pending");
  const failed = await getFacedRecordsByStatus("failed");
  const toSync = [...pending, ...failed];

  const pendingAssistance = await getFamilyAssistanceRecordsByStatus("pending");
  const failedAssistance = await getFamilyAssistanceRecordsByStatus("failed");
  const toSyncAssistance = [...pendingAssistance, ...failedAssistance];

  if (toSync.length === 0 && toSyncAssistance.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      records: toSync.map(serializeRecord),
      assistance_records: toSyncAssistance.map(serializeAssistanceRecord),
    }),
  });

  const body = await parseSyncResponse(response);

  if (!response.ok) {
    throw new Error(body.error ?? `Sync request failed (${response.status})`);
  }

  const syncedUuids = body.synced ?? [];
  const failedItems = body.failed ?? [];
  const syncedAssistanceUuids = body.synced_assistance ?? [];
  const failedAssistanceItems = body.failed_assistance ?? [];

  for (const uuid of syncedUuids) {
    await markFacedRecordSynced(uuid);
  }
  for (const item of failedItems) {
    await markFacedRecordFailed(item.uuid);
  }
  for (const uuid of syncedAssistanceUuids) {
    await markFamilyAssistanceSynced(uuid);
  }
  for (const item of failedAssistanceItems) {
    await markFamilyAssistanceFailed(item.uuid);
  }

  return {
    synced: syncedUuids.length + syncedAssistanceUuids.length,
    failed: failedItems.length + failedAssistanceItems.length,
    errors: [...failedItems, ...failedAssistanceItems].map((f) => f.error),
  };
}
