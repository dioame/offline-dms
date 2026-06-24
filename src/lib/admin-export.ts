import {
  FACED_EXPORT_SELECT,
  facedRecordsWhere,
  parseTursoFacedRecordRow,
  type TursoExportRecord,
} from "./faced-export-shared";
import { ensureTursoSchema, getTursoClient } from "./turso";

export type AdminExportInput = {
  access_code?: string;
};

export async function listFacedRecordsForAdminExport(
  input: AdminExportInput = {},
): Promise<TursoExportRecord[]> {
  const accessCode = input.access_code?.trim() ?? "";

  await ensureTursoSchema();
  const db = getTursoClient();

  const result = accessCode
    ? await db.execute({
        sql: `
          ${FACED_EXPORT_SELECT}
          ${facedRecordsWhere("access_code = ?")}
          ORDER BY updated_at DESC
        `,
        args: [accessCode],
      })
    : await db.execute({
        sql: `
          ${FACED_EXPORT_SELECT}
          ${facedRecordsWhere()}
          ORDER BY updated_at DESC
        `,
      });

  const records: TursoExportRecord[] = [];

  for (const row of result.rows) {
    const parsed = parseTursoFacedRecordRow(row);
    if (parsed) records.push(parsed);
  }

  return records;
}
