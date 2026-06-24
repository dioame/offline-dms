import {
  FACED_EXPORT_SELECT,
  facedRecordsWhere,
  parseTursoFacedRecordRow,
  type TursoExportRecord,
} from "./faced-export-shared";
import { ensureTursoSchema, getTursoClient } from "./turso";

export type VerifyExportInput = {
  city_municipality: string;
  barangay: string;
};

export type VerifyExportRecord = TursoExportRecord;

function norm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function listFacedRecordsForExport(
  input: VerifyExportInput,
): Promise<VerifyExportRecord[]> {
  const municipality = input.city_municipality.trim();
  const barangay = input.barangay.trim();

  if (!municipality) {
    throw new Error("City / municipality is required.");
  }
  if (!barangay) {
    throw new Error("Barangay is required.");
  }

  await ensureTursoSchema();
  const db = getTursoClient();

  const result = await db.execute({
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

  const records: VerifyExportRecord[] = [];

  for (const row of result.rows) {
    const parsed = parseTursoFacedRecordRow(row);
    if (parsed) records.push(parsed);
  }

  return records;
}
