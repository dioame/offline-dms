import { createClient, type Client } from "@libsql/client";
import { getDatabaseClientConfig } from "./env";

let client: Client | null = null;

export function getTursoClient(): Client {
  if (!client) {
<<<<<<< HEAD
    const { url, authToken } = getTursoEnv();
    client = authToken
      ? createClient({ url, authToken })
      : createClient({ url });
=======
    const { url, authToken } = getDatabaseClientConfig();
    client = authToken ? createClient({ url, authToken }) : createClient({ url });
>>>>>>> dadc66ef36a982c53e4d97b232e6c9dd731c6063
  }
  return client;
}

export async function ensureTursoSchema(): Promise<void> {
  const { runMigrations } = await import("./run-migrations");
  await runMigrations(getTursoClient());
}

export type TursoFacedRow = {
  uuid: string;
  access_code: string;
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
        uuid, access_code, enumerator_name, barangay, city_municipality, province,
        date_registered, payload, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uuid) DO UPDATE SET
        access_code = CASE
          WHEN TRIM(excluded.access_code) != '' THEN excluded.access_code
          ELSE faced_records.access_code
        END,
        enumerator_name = excluded.enumerator_name,
        barangay = excluded.barangay,
        city_municipality = excluded.city_municipality,
        province = excluded.province,
        date_registered = excluded.date_registered,
        payload = excluded.payload,
        updated_at = excluded.updated_at,
        deleted_at = faced_records.deleted_at
    `,
    args: [
      row.uuid,
      row.access_code,
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
