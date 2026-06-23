import { ensureTursoSchema, getTursoClient } from "./turso";
import type { VerifyCacheEntry } from "./verify-match";

export type VerifySyncChunk = {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  records: VerifyCacheEntry[];
};

const DEFAULT_LIMIT = 500;

function rowToCacheEntry(row: Record<string, unknown>): VerifyCacheEntry | null {
  let payload: {
    head_of_family?: {
      first_name?: string;
      last_name?: string;
      middle_name?: string;
      birthdate?: string;
    };
    city_municipality?: string;
  };

  try {
    payload = JSON.parse(String(row.payload)) as typeof payload;
  } catch {
    return null;
  }

  const head = payload.head_of_family ?? {};

  return {
    uuid: String(row.uuid),
    first_name: head.first_name?.trim() ?? "",
    last_name: head.last_name?.trim() ?? "",
    middle_name: head.middle_name?.trim() ?? "",
    birthdate: head.birthdate?.trim() ?? "",
    barangay: String(row.barangay ?? "").trim(),
    city_municipality: String(
      row.city_municipality ?? payload.city_municipality ?? "",
    ).trim(),
    enumerator_name: String(row.enumerator_name ?? "").trim(),
    date_registered: String(row.date_registered ?? "").trim(),
    encoded_at: String(row.updated_at ?? ""),
  };
}

export async function listVerifyCacheChunk(
  offset: number,
  limit = DEFAULT_LIMIT,
): Promise<VerifySyncChunk> {
  await ensureTursoSchema();
  const db = getTursoClient();

  const safeOffset = Math.max(0, offset);
  const safeLimit = Math.min(Math.max(1, limit), 1000);

  const [countResult, pageResult] = await Promise.all([
    db.execute({ sql: `SELECT COUNT(*) AS total FROM faced_records` }),
    db.execute({
      sql: `
        SELECT
          uuid,
          barangay,
          city_municipality,
          enumerator_name,
          date_registered,
          updated_at,
          payload
        FROM faced_records
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
      `,
      args: [safeLimit, safeOffset],
    }),
  ]);

  const total = Number(countResult.rows[0]?.total ?? 0);
  const records = pageResult.rows
    .map((row) => rowToCacheEntry(row as Record<string, unknown>))
    .filter((entry): entry is VerifyCacheEntry => entry !== null);

  return {
    total,
    offset: safeOffset,
    limit: safeLimit,
    hasMore: safeOffset + records.length < total,
    records,
  };
}
