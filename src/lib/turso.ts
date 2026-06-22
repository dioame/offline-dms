import { createClient, type Client } from "@libsql/client";
import { getTursoEnv } from "./env";

let client: Client | null = null;

export function getTursoClient(): Client {
  if (!client) {
    const { url, authToken } = getTursoEnv();
    client = createClient({ url, authToken });
  }
  return client;
}

export async function ensureTursoSchema(): Promise<void> {
  const { runMigrations } = await import("../../scripts/migration-core.mjs");
  await runMigrations(getTursoClient());
}

export type TursoFacedRow = {
  uuid: string;
  enumerator_name: string;
  barangay: string;
  city_municipality: string;
  province: string;
  date_registered: string;
  payload: string;
  created_at: string;
  updated_at: string;
};

export async function upsertFacedRecord(row: TursoFacedRow): Promise<void> {
  const db = getTursoClient();

  await db.execute({
    sql: `
      INSERT INTO faced_records (
        uuid, enumerator_name, barangay, city_municipality, province,
        date_registered, payload, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        enumerator_name = excluded.enumerator_name,
        barangay = excluded.barangay,
        city_municipality = excluded.city_municipality,
        province = excluded.province,
        date_registered = excluded.date_registered,
        payload = excluded.payload,
        updated_at = excluded.updated_at
    `,
    args: [
      row.uuid,
      row.enumerator_name,
      row.barangay,
      row.city_municipality,
      row.province,
      row.date_registered,
      row.payload,
      row.created_at,
      row.updated_at,
    ],
  });
}
