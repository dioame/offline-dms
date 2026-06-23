import type { FacedRecordData } from "./faced-types";
import { ensureTursoSchema, getTursoClient } from "./turso";

export type VerifyExportInput = {
  city_municipality: string;
  barangay: string;
};

export type VerifyExportRecord = FacedRecordData & {
  uuid: string;
  sync_status: "synced";
  createdAt: string;
  updatedAt: string;
};

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
        updated_at
      FROM faced_records
      WHERE LOWER(TRIM(city_municipality)) = ?
        AND LOWER(TRIM(barangay)) = ?
      ORDER BY updated_at DESC
    `,
    args: [norm(municipality), norm(barangay)],
  });

  const records: VerifyExportRecord[] = [];

  for (const row of result.rows) {
    let payload: FacedRecordData;
    try {
      payload = JSON.parse(String(row.payload)) as FacedRecordData;
    } catch {
      continue;
    }

    records.push({
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
    });
  }

  return records;
}
