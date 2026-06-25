import { ensureTursoSchema, getTursoClient } from "./turso";
import { backfillFacedRecordAccessCodes } from "./backfill-access-codes";
import { isSaranganiMunicipality } from "./sarangani-locations";

export type AdminStatsFilter = {
  municipality?: string;
};

function normMunicipality(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function resolveMunicipalityFilter(filter: AdminStatsFilter = {}): string | undefined {
  const municipality = filter.municipality?.trim();
  if (!municipality || !isSaranganiMunicipality(municipality)) {
    return undefined;
  }
  return municipality;
}

function municipalitySql(filter: AdminStatsFilter = {}): { clause: string; args: string[] } {
  const municipality = resolveMunicipalityFilter(filter);
  if (!municipality) {
    return { clause: "", args: [] };
  }
  return {
    clause: " AND LOWER(TRIM(city_municipality)) = ?",
    args: [normMunicipality(municipality)],
  };
}

export type EnumeratorSummary = {
  access_code: string;
  enumerator_name: string;
  enumerator_email: string | null;
  total_encoded: number;
  total_codes: number;
  active_codes: number;
  used_codes: number;
  rejected_codes: number;
  last_encoded_at: string | null;
  last_used_at: string | null;
};

export type EnumeratorSummaryTotals = {
  enumerators: number;
  total_encoded: number;
  total_codes: number;
  active_codes: number;
  used_codes: number;
  rejected_codes: number;
};

export type RecordsAdminMetrics = {
  duplicate_group_count: number;
  duplicate_record_count: number;
  soft_deleted_count: number;
};

export type DailyEncodeStat = {
  date: string;
  count: number;
};

function isoDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildDailyRange(days: number): string[] {
  const result: string[] = [];
  const end = new Date();
  end.setHours(12, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    result.push(isoDateOnly(d));
  }
  return result;
}

export async function getDailyEncodeStats(
  days = 30,
  filter: AdminStatsFilter = {},
): Promise<DailyEncodeStat[]> {
  const safeDays = Math.min(90, Math.max(7, days));
  await ensureTursoSchema();
  const db = getTursoClient();
  const { clause, args } = municipalitySql(filter);

  const range = buildDailyRange(safeDays);
  const startDate = range[0];

  const result = await db.execute({
    sql: `
      SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS count
      FROM faced_records
      WHERE deleted_at IS NULL
        AND substr(created_at, 1, 10) >= ?
        ${clause}
      GROUP BY day
    `,
    args: [startDate, ...args],
  });

  const counts = new Map<string, number>();
  for (const row of result.rows) {
    const day = String(row.day ?? "");
    if (!day) continue;
    counts.set(day, Number(row.count ?? 0));
  }

  return range.map((date) => ({
    date,
    count: counts.get(date) ?? 0,
  }));
}

export async function getRecordsAdminMetrics(
  filter: AdminStatsFilter = {},
): Promise<RecordsAdminMetrics> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const { clause, args } = municipalitySql(filter);
  const deletedClause = clause.replace(/city_municipality/g, "fr.city_municipality");

  const [groupsResult, recordsResult, softDeletedResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT COUNT(*) AS group_count
        FROM (
          SELECT 1
          FROM faced_records
          WHERE deleted_at IS NULL
            AND TRIM(json_extract(payload, '$.head_of_family.first_name')) != ''
            AND TRIM(json_extract(payload, '$.head_of_family.last_name')) != ''
            ${clause}
          GROUP BY
            LOWER(TRIM(json_extract(payload, '$.head_of_family.first_name'))),
            LOWER(TRIM(json_extract(payload, '$.head_of_family.last_name')))
          HAVING COUNT(*) > 1
        )
      `,
      args,
    }),
    db.execute({
      sql: `
        WITH duplicate_keys AS (
          SELECT
            LOWER(TRIM(json_extract(payload, '$.head_of_family.first_name'))) AS first_name,
            LOWER(TRIM(json_extract(payload, '$.head_of_family.last_name'))) AS last_name
          FROM faced_records
          WHERE deleted_at IS NULL
            AND TRIM(json_extract(payload, '$.head_of_family.first_name')) != ''
            AND TRIM(json_extract(payload, '$.head_of_family.last_name')) != ''
            ${clause}
          GROUP BY first_name, last_name
          HAVING COUNT(*) > 1
        )
        SELECT COUNT(*) AS record_count
        FROM faced_records fr
        INNER JOIN duplicate_keys dk ON
          dk.first_name = LOWER(TRIM(json_extract(fr.payload, '$.head_of_family.first_name')))
          AND dk.last_name = LOWER(TRIM(json_extract(fr.payload, '$.head_of_family.last_name')))
        WHERE fr.deleted_at IS NULL
          ${deletedClause}
      `,
      args: [...args, ...args],
    }),
    db.execute({
      sql: `
        SELECT COUNT(*) AS soft_deleted
        FROM faced_records
        WHERE deleted_at IS NOT NULL
        ${clause}
      `,
      args,
    }),
  ]);

  return {
    duplicate_group_count: Number(groupsResult.rows[0]?.group_count ?? 0),
    duplicate_record_count: Number(recordsResult.rows[0]?.record_count ?? 0),
    soft_deleted_count: Number(softDeletedResult.rows[0]?.soft_deleted ?? 0),
  };
}

export async function getEnumeratorSummaries(
  filter: AdminStatsFilter = {},
): Promise<{
  summaries: EnumeratorSummary[];
  totals: EnumeratorSummaryTotals;
}> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const { clause, args } = municipalitySql(filter);
  const municipality = resolveMunicipalityFilter(filter);

  await backfillFacedRecordAccessCodes(db);

  const [codeResult, totalEncodedResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT
          ac.code AS access_code,
          ac.enumerator_name,
          ac.enumerator_email,
          ac.status,
          ac.last_used_at,
          COALESCE(fr.total_encoded, 0) AS total_encoded,
          fr.last_encoded_at
        FROM access_codes ac
        LEFT JOIN (
          SELECT
            access_code,
            COUNT(*) AS total_encoded,
            MAX(updated_at) AS last_encoded_at
          FROM faced_records
          WHERE TRIM(access_code) != ''
            AND deleted_at IS NULL
            ${clause}
          GROUP BY access_code
        ) fr ON fr.access_code = ac.code
        ORDER BY total_encoded DESC, ac.code ASC
      `,
      args,
    }),
    db.execute({
      sql: `
        SELECT COUNT(*) AS total_encoded
        FROM faced_records
        WHERE deleted_at IS NULL
        ${clause}
      `,
      args,
    }),
  ]);

  const summaries: EnumeratorSummary[] = codeResult.rows
    .map((row) => {
      const name = row.enumerator_name ? String(row.enumerator_name).trim() : "";
      const email = row.enumerator_email ? String(row.enumerator_email).trim() : null;
      const status = String(row.status);

      return {
        access_code: String(row.access_code),
        enumerator_name: name || email || "Unassigned",
        enumerator_email: email,
        total_encoded: Number(row.total_encoded),
        total_codes: 1,
        active_codes: status === "active" ? 1 : 0,
        used_codes: status === "used" ? 1 : 0,
        rejected_codes: status === "rejected" ? 1 : 0,
        last_encoded_at: row.last_encoded_at ? String(row.last_encoded_at) : null,
        last_used_at: row.last_used_at ? String(row.last_used_at) : null,
      };
    })
    .filter((row) => !municipality || row.total_encoded > 0);

  const totals = summaries.reduce<EnumeratorSummaryTotals>(
    (acc, row) => ({
      enumerators: acc.enumerators + 1,
      total_encoded: acc.total_encoded,
      total_codes: acc.total_codes + row.total_codes,
      active_codes: acc.active_codes + row.active_codes,
      used_codes: acc.used_codes + row.used_codes,
      rejected_codes: acc.rejected_codes + row.rejected_codes,
    }),
    {
      enumerators: 0,
      total_encoded: Number(totalEncodedResult.rows[0]?.total_encoded ?? 0),
      total_codes: 0,
      active_codes: 0,
      used_codes: 0,
      rejected_codes: 0,
    },
  );

  return { summaries, totals };
}
