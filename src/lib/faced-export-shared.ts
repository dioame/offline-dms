import type { FacedRecordData } from "./faced-types";

export type TursoExportRecord = FacedRecordData & {
  uuid: string;
  sync_status: "synced";
  createdAt: string;
  updatedAt: string;
};

type TursoFacedRecordRow = Record<string, unknown>;

export function parseTursoFacedRecordRow(
  row: TursoFacedRecordRow,
): TursoExportRecord | null {
  let payload: FacedRecordData;
  try {
    payload = JSON.parse(String(row.payload)) as FacedRecordData;
  } catch {
    return null;
  }

  return {
    ...payload,
    access_code: String(row.access_code ?? payload.access_code ?? ""),
    enumerator_name: String(row.enumerator_name ?? payload.enumerator_name ?? ""),
    barangay: String(row.barangay ?? payload.barangay ?? ""),
    city_municipality: String(
      row.city_municipality ?? payload.city_municipality ?? "",
    ),
    province: String(row.province ?? payload.province ?? ""),
    date_registered: String(row.date_registered ?? payload.date_registered ?? ""),
    uuid: String(row.uuid),
    sync_status: "synced",
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export const FACED_RECORDS_ACTIVE_FILTER = `deleted_at IS NULL`;

export function facedRecordsWhere(clause?: string): string {
  if (!clause?.trim()) {
    return `WHERE ${FACED_RECORDS_ACTIVE_FILTER}`;
  }
  return `WHERE ${FACED_RECORDS_ACTIVE_FILTER} AND (${clause})`;
}

export const FACED_EXPORT_SELECT = `
  SELECT
    uuid,
    access_code,
    enumerator_name,
    barangay,
    city_municipality,
    province,
    date_registered,
    payload,
    created_at,
    updated_at,
    deleted_at
  FROM faced_records
`;
