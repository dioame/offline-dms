import Dexie, { type EntityTable } from "dexie";
import { v4 as uuidv4 } from "uuid";
import {
  createEmptyFacedRecord,
  type FacedRecord,
  type FacedRecordData,
  type SyncStatus,
} from "./faced-types";

export type VerifyCacheMeta = {
  id: "current";
  syncedAt: string;
  totalRecords: number;
};

export type EncodeOfflineMeta = {
  id: "current";
  syncedAt: string;
  totalFamilies: number;
  totalEcSites: number;
};

const db = new Dexie("OfflineDMS") as Dexie & {
  faced_records: EntityTable<FacedRecord, "id">;
  auth_session: EntityTable<AuthSession, "id">;
  verify_cache: EntityTable<import("./verify-match").VerifyCacheEntry, "uuid">;
  verify_meta: EntityTable<VerifyCacheMeta, "id">;
  ec_library_cache: EntityTable<import("./encode-offline-types").EcLibraryCacheEntry, "id">;
  encode_offline_meta: EntityTable<EncodeOfflineMeta, "id">;
  duplicate_exclusions_cache: EntityTable<
    import("./duplicate-exclusion-types").DuplicateExclusionCacheEntry,
    "pair_key"
  >;
};

export type AuthSession = {
  id: "current";
  code: string;
  sessionId: string;
  loggedInAt: Date;
  enumeratorName?: string;
  enumeratorEmail?: string;
};

db.version(1).stores({
  beneficiaries: "++id, firstName, createdAt",
});

db.version(2)
  .stores({
    faced_records: "++id, uuid, barangay, sync_status, createdAt, date_registered",
    beneficiaries: null,
  })
  .upgrade(async (tx) => {
    await tx.table("beneficiaries").clear();
  });

db.version(3)
  .stores({
    faced_records:
      "++id, uuid, barangay, enumerator_name, sync_status, createdAt, date_registered",
  })
  .upgrade(async (tx) => {
    await tx
      .table("faced_records")
      .toCollection()
      .modify((record) => {
        if (record.enumerator_name === undefined) {
          record.enumerator_name = "";
        }
      });
  });

db.version(4).stores({
  faced_records:
    "++id, uuid, barangay, enumerator_name, sync_status, createdAt, date_registered",
  auth_session: "id",
});

db.version(5)
  .stores({
    faced_records:
      "++id, uuid, barangay, access_code, enumerator_name, sync_status, createdAt, date_registered",
    auth_session: "id",
  })
  .upgrade(async (tx) => {
    await tx
      .table("faced_records")
      .toCollection()
      .modify((record) => {
        if (record.access_code === undefined) {
          record.access_code = "";
        }
      });
  });

db.version(6).stores({
  faced_records:
    "++id, uuid, barangay, access_code, enumerator_name, sync_status, createdAt, date_registered",
  auth_session: "id",
  verify_cache: "uuid, last_name, first_name, barangay, city_municipality",
  verify_meta: "id",
});

db.version(7).stores({
  faced_records:
    "++id, uuid, barangay, access_code, enumerator_name, sync_status, createdAt, date_registered",
  auth_session: "id",
  verify_cache: "uuid, last_name, first_name, barangay, city_municipality",
  verify_meta: "id",
  ec_library_cache: "id, city_municipality, barangay, site_name",
  encode_offline_meta: "id",
});

db.version(8).stores({
  faced_records:
    "++id, uuid, barangay, access_code, enumerator_name, sync_status, createdAt, date_registered",
  auth_session: "id",
  verify_cache: "uuid, last_name, first_name, barangay, city_municipality",
  verify_meta: "id",
  ec_library_cache: "id, city_municipality, barangay, site_name",
  encode_offline_meta: "id",
  duplicate_exclusions_cache: "pair_key, uuid_a, uuid_b, name_key",
});

export async function getAuthSession(): Promise<AuthSession | undefined> {
  return db.auth_session.get("current");
}

export async function saveAuthSession(
  code: string,
  sessionId: string,
  assignee?: { enumeratorName?: string | null; enumeratorEmail?: string | null },
): Promise<void> {
  const existing = await db.auth_session.get("current");
  await db.auth_session.put({
    id: "current",
    code: code.trim().toUpperCase(),
    sessionId,
    loggedInAt: existing?.loggedInAt ?? new Date(),
    enumeratorName: assignee?.enumeratorName?.trim() || undefined,
    enumeratorEmail: assignee?.enumeratorEmail?.trim() || undefined,
  });
}

export async function clearAuthSession(): Promise<void> {
  await db.auth_session.delete("current");
}

export { db };

export async function addFacedRecord(data: FacedRecordData): Promise<number> {
  const now = new Date();
  const id = await db.faced_records.add({
    ...data,
    uuid: uuidv4(),
    sync_status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  return id as number;
}

export async function updateFacedRecord(
  id: number,
  data: FacedRecordData,
): Promise<void> {
  await db.faced_records.update(id, {
    ...data,
    updatedAt: new Date(),
    sync_status: "pending",
  });
}

export async function getFacedRecords(): Promise<FacedRecord[]> {
  return db.faced_records.orderBy("createdAt").reverse().toArray();
}

export async function getFacedRecord(id: number): Promise<FacedRecord | undefined> {
  return db.faced_records.get(id);
}

export async function getFacedRecordByUuid(uuid: string): Promise<FacedRecord | undefined> {
  const trimmed = uuid.trim();
  if (!trimmed) return undefined;
  return db.faced_records.where("uuid").equals(trimmed).first();
}

export async function deleteFacedRecord(id: number): Promise<void> {
  await db.faced_records.delete(id);
}

export async function getFacedRecordsByStatus(
  status: SyncStatus,
): Promise<FacedRecord[]> {
  return db.faced_records.where("sync_status").equals(status).toArray();
}

export async function markFacedRecordSynced(uuid: string): Promise<void> {
  const record = await db.faced_records.where("uuid").equals(uuid).first();
  if (record?.id) {
    await db.faced_records.update(record.id, {
      sync_status: "synced",
      updatedAt: new Date(),
    });
  }
}

export async function markFacedRecordFailed(uuid: string): Promise<void> {
  const record = await db.faced_records.where("uuid").equals(uuid).first();
  if (record?.id) {
    await db.faced_records.update(record.id, {
      sync_status: "failed",
      updatedAt: new Date(),
    });
  }
}

export { createEmptyFacedRecord };
