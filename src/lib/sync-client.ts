import {
  getFacedRecordsByStatus,
  markFacedRecordFailed,
  markFacedRecordSynced,
} from "./db";
import type { FacedRecord } from "./faced-types";

function serializeRecord(record: FacedRecord) {
  return {
    ...record,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
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

  if (toSync.length === 0) {
    return { synced: 0, failed: 0 };
  }

  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      records: toSync.map(serializeRecord),
    }),
  });

  const body = (await response.json()) as {
    synced?: string[];
    failed?: { uuid: string; error: string }[];
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body.error ?? "Sync request failed");
  }

  const syncedUuids = body.synced ?? [];
  const failedItems = body.failed ?? [];

  for (const uuid of syncedUuids) {
    await markFacedRecordSynced(uuid);
  }
  for (const item of failedItems) {
    await markFacedRecordFailed(item.uuid);
  }

  return {
    synced: syncedUuids.length,
    failed: failedItems.length,
    errors: failedItems.map((f) => f.error),
  };
}
