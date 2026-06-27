import {
  FACED_EXPORT_SELECT,
  facedRecordsWhere,
  parseTursoFacedRecordRow,
  type TursoExportRecord,
} from "./faced-export-shared";
import { ensureTursoSchema, getTursoClient } from "./turso";

export type AdminExportInput = {
  access_code?: string;
  city_municipality?: string;
  barangay?: string;
};

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function listFacedRecordsForAdminExport(
  input: AdminExportInput = {},
): Promise<TursoExportRecord[]> {
  const accessCode = input.access_code?.trim() ?? "";
  const municipality = input.city_municipality?.trim() ?? "";
  const barangay = input.barangay?.trim() ?? "";

  await ensureTursoSchema();
  const db = getTursoClient();

  let result;

  if (accessCode) {
    result = await db.execute({
      sql: `
        ${FACED_EXPORT_SELECT}
        ${facedRecordsWhere("access_code = ?")}
        ORDER BY updated_at DESC
      `,
      args: [accessCode],
    });
  } else if (municipality) {
    if (barangay) {
      result = await db.execute({
        sql: `
          ${FACED_EXPORT_SELECT}
          ${facedRecordsWhere(`
            LOWER(TRIM(city_municipality)) = ?
            AND LOWER(TRIM(barangay)) = ?
          `)}
          ORDER BY updated_at DESC
        `,
        args: [norm(municipality), norm(barangay)],
      });
    } else {
      result = await db.execute({
        sql: `
          ${FACED_EXPORT_SELECT}
          ${facedRecordsWhere("LOWER(TRIM(city_municipality)) = ?")}
          ORDER BY updated_at DESC
        `,
        args: [norm(municipality)],
      });
    }
  } else {
    result = await db.execute({
      sql: `
        ${FACED_EXPORT_SELECT}
        ${facedRecordsWhere()}
        ORDER BY updated_at DESC
      `,
    });
  }

  const records: TursoExportRecord[] = [];

  for (const row of result.rows) {
    const parsed = parseTursoFacedRecordRow(row);
    if (parsed) records.push(parsed);
  }

  return records;
}
