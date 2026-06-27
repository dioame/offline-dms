import type { FamilyAssistanceRecordData } from "./family-assistance-types";
import { toFamilyAssistancePrintRow } from "./print/facedAnnexPrint";
import type { FamilyAssistancePrintRow } from "./print/faced-print-types";
import { ensureTursoSchema, getTursoClient } from "./turso";

export type TursoFamilyAssistanceRow = {
  uuid: string;
  faced_record_uuid: string;
  access_code: string;
  date_provided: string;
  receiving_member_name: string;
  assistance_received: string;
  unit: string;
  quantity: string;
  cost_of_assistance: string;
  provider: string;
  created_at: string;
  updated_at: string;
};

export async function upsertFamilyAssistanceRecord(row: TursoFamilyAssistanceRow): Promise<void> {
  await ensureTursoSchema();
  const db = getTursoClient();

  await db.execute({
    sql: `
      INSERT INTO family_assistance_record (
        uuid,
        faced_record_uuid,
        access_code,
        date_provided,
        receiving_member_name,
        assistance_received,
        unit,
        quantity,
        cost_of_assistance,
        provider,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        faced_record_uuid = excluded.faced_record_uuid,
        access_code = CASE
          WHEN TRIM(excluded.access_code) != '' THEN excluded.access_code
          ELSE family_assistance_record.access_code
        END,
        date_provided = excluded.date_provided,
        receiving_member_name = excluded.receiving_member_name,
        assistance_received = excluded.assistance_received,
        unit = excluded.unit,
        quantity = excluded.quantity,
        cost_of_assistance = excluded.cost_of_assistance,
        provider = excluded.provider,
        updated_at = excluded.updated_at
    `,
    args: [
      row.uuid,
      row.faced_record_uuid,
      row.access_code,
      row.date_provided,
      row.receiving_member_name,
      row.assistance_received,
      row.unit,
      row.quantity,
      row.cost_of_assistance,
      row.provider,
      row.created_at,
      row.updated_at,
    ],
  });
}

function parseAssistanceRow(row: Record<string, unknown>): TursoFamilyAssistanceRow {
  return {
    uuid: String(row.uuid ?? ""),
    faced_record_uuid: String(row.faced_record_uuid ?? ""),
    access_code: String(row.access_code ?? ""),
    date_provided: String(row.date_provided ?? ""),
    receiving_member_name: String(row.receiving_member_name ?? ""),
    assistance_received: String(row.assistance_received ?? ""),
    unit: String(row.unit ?? ""),
    quantity: String(row.quantity ?? ""),
    cost_of_assistance: String(row.cost_of_assistance ?? ""),
    provider: String(row.provider ?? ""),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
  };
}

export async function listFamilyAssistanceByFacedRecordUuid(
  facedRecordUuid: string,
): Promise<FamilyAssistancePrintRow[]> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const result = await db.execute({
    sql: `
      SELECT *
      FROM family_assistance_record
      WHERE faced_record_uuid = ?
      ORDER BY date_provided ASC, created_at ASC
    `,
    args: [facedRecordUuid],
  });

  return result.rows.map((row) =>
    toFamilyAssistancePrintRow(parseAssistanceRow(row as Record<string, unknown>)),
  );
}

export async function listFamilyAssistanceByFacedRecordUuids(
  facedRecordUuids: string[],
): Promise<Map<string, FamilyAssistancePrintRow[]>> {
  const uniqueUuids = [...new Set(facedRecordUuids.map((uuid) => uuid.trim()).filter(Boolean))];
  const out = new Map<string, FamilyAssistancePrintRow[]>();
  if (uniqueUuids.length === 0) return out;

  await ensureTursoSchema();
  const db = getTursoClient();
  const placeholders = uniqueUuids.map(() => "?").join(", ");
  const result = await db.execute({
    sql: `
      SELECT *
      FROM family_assistance_record
      WHERE faced_record_uuid IN (${placeholders})
      ORDER BY faced_record_uuid ASC, date_provided ASC, created_at ASC
    `,
    args: uniqueUuids,
  });

  for (const row of result.rows) {
    const parsed = parseAssistanceRow(row as Record<string, unknown>);
    const key = parsed.faced_record_uuid;
    const list = out.get(key) ?? [];
    list.push(toFamilyAssistancePrintRow(parsed));
    out.set(key, list);
  }

  return out;
}

export { serializeFamilyAssistanceRecord } from "./family-assistance-types";

export function toTursoFamilyAssistanceRow(
  record: FamilyAssistanceRecordData & {
    uuid: string;
    createdAt: string | Date;
    updatedAt: string | Date;
  },
): TursoFamilyAssistanceRow {
  return {
    uuid: record.uuid,
    faced_record_uuid: record.faced_record_uuid,
    access_code: record.access_code,
    date_provided: record.date_provided,
    receiving_member_name: record.receiving_member_name,
    assistance_received: record.assistance_received,
    unit: record.unit,
    quantity: record.quantity,
    cost_of_assistance: record.cost_of_assistance,
    provider: record.provider,
    created_at:
      record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    updated_at:
      record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
  };
}
