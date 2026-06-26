import type { FacedRecordData } from "./faced-types";
import { ensureFacedSerialNumber } from "./faced-serial";
import {
  FACED_EXPORT_SELECT,
  facedRecordsWhere,
  parseTursoFacedRecordRow,
  type TursoExportRecord,
} from "./faced-export-shared";
import { formatHeadName, normField } from "./verify-match";
import { sortDuplicateGroups } from "./duplicate-groups";
import { ensureTursoSchema, getTursoClient, upsertFacedRecord } from "./turso";

export type FamilyMemberListItem = {
  name: string;
  relationship: string;
  birthdate: string;
  age: string;
  sex: string;
};

export type FacedRecordListItem = {
  uuid: string;
  headName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  birthdate: string;
  barangay: string;
  city_municipality: string;
  province: string;
  enumerator_name: string;
  access_code: string;
  date_registered: string;
  updated_at: string;
  deleted_at?: string;
  family_members: FamilyMemberListItem[];
};

export type FacedRecordAdminDetail = TursoExportRecord;

export { adminRecordToFormData } from "./records-client";

export type DuplicateGroup = {
  key: string;
  first_name: string;
  last_name: string;
  count: number;
  records: FacedRecordListItem[];
};

function compareListItems(a: FacedRecordListItem, b: FacedRecordListItem): number {
  const byName =
    a.lastName.localeCompare(b.lastName, "en", { sensitivity: "base" }) ||
    a.firstName.localeCompare(b.firstName, "en", { sensitivity: "base" }) ||
    (a.middleName || "").localeCompare(b.middleName || "", "en", { sensitivity: "base" });
  if (byName !== 0) return byName;

  const byBirthdate = (a.birthdate || "").localeCompare(b.birthdate || "");
  if (byBirthdate !== 0) return byBirthdate;

  const byBarangay = (a.barangay || "").localeCompare(b.barangay || "", "en", {
    sensitivity: "base",
  });
  if (byBarangay !== 0) return byBarangay;

  return a.uuid.localeCompare(b.uuid);
}

function buildDuplicateGroup(key: string, records: FacedRecordListItem[]): DuplicateGroup {
  const sortedRecords = [...records].sort(compareListItems);
  const lead = sortedRecords[0];
  return {
    key,
    first_name: lead?.firstName ?? "",
    last_name: lead?.lastName ?? "",
    count: sortedRecords.length,
    records: sortedRecords,
  };
}

export type ListFacedRecordsInput = {
  search?: string;
  page?: number;
  pageSize?: number;
};

export type ListFacedRecordsResult = {
  records: FacedRecordListItem[];
  total: number;
  page: number;
  pageSize: number;
};

function summarizeFamilyMembers(payload: FacedRecordData): FamilyMemberListItem[] {
  return (payload.family_members ?? [])
    .filter((member) => member.family_member_name?.trim())
    .map((member) => ({
      name: member.family_member_name.trim(),
      relationship: member.relationship_to_family_head?.trim() ?? "",
      birthdate: member.birthdate?.trim() ?? "",
      age: member.age?.trim() ?? "",
      sex: member.sex?.trim() ?? "",
    }));
}

export function facedRecordToListItem(
  row: Record<string, unknown>,
  payload: FacedRecordData,
): FacedRecordListItem {
  const head = payload.head_of_family;
  return {
    uuid: String(row.uuid),
    headName: formatHeadName({
      first_name: head.first_name,
      middle_name: head.middle_name,
      last_name: head.last_name,
      name_extension: head.name_extension,
    }),
    firstName: head.first_name ?? "",
    middleName: head.middle_name ?? "",
    lastName: head.last_name ?? "",
    birthdate: head.birthdate ?? "",
    barangay: String(row.barangay ?? payload.barangay ?? ""),
    city_municipality: String(row.city_municipality ?? payload.city_municipality ?? ""),
    province: String(row.province ?? payload.province ?? ""),
    enumerator_name: String(row.enumerator_name ?? payload.enumerator_name ?? ""),
    access_code: String(row.access_code ?? payload.access_code ?? ""),
    date_registered: String(row.date_registered ?? payload.date_registered ?? ""),
    updated_at: String(row.updated_at ?? ""),
    deleted_at: row.deleted_at ? String(row.deleted_at) : undefined,
    family_members: summarizeFamilyMembers(payload),
  };
}

function parseRowListItem(row: Record<string, unknown>): FacedRecordListItem | null {
  const parsed = parseTursoFacedRecordRow(row);
  if (!parsed) return null;
  return facedRecordToListItem(row, parsed);
}

export async function listFacedRecordsAdmin(
  input: ListFacedRecordsInput = {},
): Promise<ListFacedRecordsResult> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 25));
  const search = input.search?.trim().toLowerCase() ?? "";
  const offset = (page - 1) * pageSize;

  await ensureTursoSchema();
  const db = getTursoClient();

  if (search) {
    const like = `%${search}%`;
    const [countResult, listResult] = await Promise.all([
      db.execute({
        sql: `
          SELECT COUNT(*) AS total
          FROM faced_records
          ${facedRecordsWhere(`
            LOWER(uuid) LIKE ?
            OR LOWER(COALESCE(enumerator_name, '')) LIKE ?
            OR LOWER(COALESCE(barangay, '')) LIKE ?
            OR LOWER(COALESCE(city_municipality, '')) LIKE ?
            OR LOWER(COALESCE(access_code, '')) LIKE ?
            OR LOWER(json_extract(payload, '$.head_of_family.first_name')) LIKE ?
            OR LOWER(json_extract(payload, '$.head_of_family.middle_name')) LIKE ?
            OR LOWER(json_extract(payload, '$.head_of_family.last_name')) LIKE ?
          `)}
        `,
        args: [like, like, like, like, like, like, like, like],
      }),
      db.execute({
        sql: `
          ${FACED_EXPORT_SELECT}
          ${facedRecordsWhere(`
            LOWER(uuid) LIKE ?
            OR LOWER(COALESCE(enumerator_name, '')) LIKE ?
            OR LOWER(COALESCE(barangay, '')) LIKE ?
            OR LOWER(COALESCE(city_municipality, '')) LIKE ?
            OR LOWER(COALESCE(access_code, '')) LIKE ?
            OR LOWER(json_extract(payload, '$.head_of_family.first_name')) LIKE ?
            OR LOWER(json_extract(payload, '$.head_of_family.middle_name')) LIKE ?
            OR LOWER(json_extract(payload, '$.head_of_family.last_name')) LIKE ?
          `)}
          ORDER BY updated_at DESC
          LIMIT ? OFFSET ?
        `,
        args: [like, like, like, like, like, like, like, like, pageSize, offset],
      }),
    ]);

    const records = listResult.rows
      .map((row) => parseRowListItem(row as Record<string, unknown>))
      .filter((item): item is FacedRecordListItem => item !== null);

    return {
      records,
      total: Number(countResult.rows[0]?.total ?? 0),
      page,
      pageSize,
    };
  }

  const [countResult, listResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) AS total FROM faced_records ${facedRecordsWhere()}` }),
    db.execute({
      sql: `
        ${FACED_EXPORT_SELECT}
        ${facedRecordsWhere()}
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [pageSize, offset],
    }),
  ]);

  const records = listResult.rows
    .map((row) => parseRowListItem(row as Record<string, unknown>))
    .filter((item): item is FacedRecordListItem => item !== null);

  return {
    records,
    total: Number(countResult.rows[0]?.total ?? 0),
    page,
    pageSize,
  };
}

export async function getFacedRecordAdmin(uuid: string): Promise<FacedRecordAdminDetail | null> {
  return getFacedRecordByUuid(uuid, "active");
}

async function getFacedRecordByUuid(
  uuid: string,
  scope: "active" | "trash" | "any",
): Promise<FacedRecordAdminDetail | null> {
  const trimmed = uuid.trim();
  if (!trimmed) return null;

  await ensureTursoSchema();
  const db = getTursoClient();

  const scopeClause =
    scope === "active"
      ? facedRecordsWhere("uuid = ?")
      : scope === "trash"
        ? "WHERE deleted_at IS NOT NULL AND uuid = ?"
        : "WHERE uuid = ?";

  const result = await db.execute({
    sql: `
      ${FACED_EXPORT_SELECT}
      ${scopeClause}
      LIMIT 1
    `,
    args: [trimmed],
  });

  if (result.rows.length === 0) return null;
  return parseTursoFacedRecordRow(result.rows[0] as Record<string, unknown>);
}

export async function getFacedRecordTrashAdmin(uuid: string): Promise<FacedRecordAdminDetail | null> {
  return getFacedRecordByUuid(uuid, "trash");
}

export type UpdateFacedRecordAdminInput = {
  enumerator_name?: string;
  barangay?: string;
  city_municipality?: string;
  province?: string;
  date_registered?: string;
  head_of_family?: Partial<FacedRecordData["head_of_family"]>;
};

export async function updateFacedRecordAdmin(
  uuid: string,
  input: UpdateFacedRecordAdminInput,
): Promise<FacedRecordAdminDetail> {
  const existing = await getFacedRecordAdmin(uuid);
  if (!existing) {
    throw new Error("Record not found.");
  }

  const updatedAt = new Date().toISOString();
  const merged: FacedRecordAdminDetail = {
    ...existing,
    enumerator_name: input.enumerator_name?.trim() ?? existing.enumerator_name,
    barangay: input.barangay?.trim() ?? existing.barangay,
    city_municipality: input.city_municipality?.trim() ?? existing.city_municipality,
    province: input.province?.trim() ?? existing.province,
    date_registered: input.date_registered?.trim() ?? existing.date_registered,
    head_of_family: {
      ...existing.head_of_family,
      ...input.head_of_family,
    },
    updatedAt,
  };

  const {
    uuid: recordUuid,
    sync_status: _sync,
    createdAt,
    updatedAt: _updatedAt,
    ...payloadData
  } = merged;

  await upsertFacedRecord({
    uuid: recordUuid,
    access_code: merged.access_code,
    enumerator_name: merged.enumerator_name,
    barangay: merged.barangay,
    city_municipality: merged.city_municipality,
    province: merged.province,
    date_registered: merged.date_registered,
    payload: JSON.stringify(payloadData),
    created_at: createdAt,
    updated_at: updatedAt,
  });

  const record = await getFacedRecordAdmin(uuid);
  if (!record) {
    throw new Error("Record could not be loaded after update.");
  }
  return record;
}

export async function replaceFacedRecordAdmin(
  uuid: string,
  data: FacedRecordData,
): Promise<FacedRecordAdminDetail> {
  const existing = await getFacedRecordAdmin(uuid);
  if (!existing) {
    throw new Error("Record not found.");
  }

  const updatedAt = new Date().toISOString();
  const accessCode = data.access_code?.trim() || existing.access_code;
  const payload: FacedRecordData = {
    ...data,
    access_code: accessCode,
    serial_number: ensureFacedSerialNumber(
      data.serial_number || existing.serial_number,
      uuid,
    ),
  };

  await upsertFacedRecord({
    uuid: uuid.trim(),
    access_code: accessCode,
    enumerator_name: payload.enumerator_name.trim(),
    barangay: payload.barangay.trim(),
    city_municipality: payload.city_municipality.trim(),
    province: payload.province.trim(),
    date_registered: payload.date_registered.trim(),
    payload: JSON.stringify(payload),
    created_at: existing.createdAt,
    updated_at: updatedAt,
  });

  const record = await getFacedRecordAdmin(uuid);
  if (!record) {
    throw new Error("Record could not be loaded after update.");
  }
  return record;
}

export function isFullFacedRecordPayload(body: unknown): body is FacedRecordData {
  if (!body || typeof body !== "object") return false;
  const candidate = body as FacedRecordData;
  return (
    Array.isArray(candidate.family_members) &&
    candidate.head_of_family !== undefined &&
    typeof candidate.head_of_family === "object"
  );
}

export async function deleteFacedRecordAdmin(uuid: string): Promise<void> {
  const trimmed = uuid.trim();
  if (!trimmed) {
    throw new Error("Record uuid is required.");
  }

  await ensureTursoSchema();
  const db = getTursoClient();
  const deletedAt = new Date().toISOString();

  const result = await db.execute({
    sql: `
      UPDATE faced_records
      SET deleted_at = ?, updated_at = ?
      WHERE uuid = ? AND deleted_at IS NULL
    `,
    args: [deletedAt, deletedAt, trimmed],
  });

  if ((result.rowsAffected ?? 0) === 0) {
    const existing = await db.execute({
      sql: `SELECT deleted_at FROM faced_records WHERE uuid = ?`,
      args: [trimmed],
    });
    if (existing.rows.length === 0) {
      throw new Error("Record not found.");
    }
    throw new Error("Record is already deleted.");
  }
}


export async function restoreFacedRecordAdmin(uuid: string): Promise<void> {
  const trimmed = uuid.trim();
  if (!trimmed) {
    throw new Error("Record uuid is required.");
  }

  await ensureTursoSchema();
  const db = getTursoClient();
  const updatedAt = new Date().toISOString();

  const result = await db.execute({
    sql: `
      UPDATE faced_records
      SET deleted_at = NULL, updated_at = ?
      WHERE uuid = ? AND deleted_at IS NOT NULL
    `,
    args: [updatedAt, trimmed],
  });

  if ((result.rowsAffected ?? 0) === 0) {
    const existing = await db.execute({
      sql: `SELECT deleted_at FROM faced_records WHERE uuid = ?`,
      args: [trimmed],
    });
    if (existing.rows.length === 0) {
      throw new Error("Record not found.");
    }
    throw new Error("Record is not in trash.");
  }
}

export async function listDuplicateGroups(): Promise<DuplicateGroup[]> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const result = await db.execute({
    sql: `
      ${FACED_EXPORT_SELECT}
      ${facedRecordsWhere()}
      ORDER BY updated_at DESC, uuid ASC
    `,
  });

  const groups = new Map<string, FacedRecordListItem[]>();

  for (const row of result.rows) {
    const item = parseRowListItem(row as Record<string, unknown>);
    if (!item) continue;

    const key = `${normField(item.lastName)}|${normField(item.firstName)}`;
    if (!normField(item.lastName) || !normField(item.firstName)) continue;

    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }

  return sortDuplicateGroups(
    [...groups.entries()]
      .filter(([, records]) => records.length > 1)
      .map(([key, records]) => buildDuplicateGroup(key, records)),
  );
}

export { countFacedRecordsTrash, listFacedRecordsTrashAdmin } from "./records-trash";
