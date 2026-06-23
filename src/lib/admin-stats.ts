import { ensureTursoSchema, getTursoClient } from "./turso";

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

export async function getEnumeratorSummaries(): Promise<{
  summaries: EnumeratorSummary[];
  totals: EnumeratorSummaryTotals;
}> {
  await ensureTursoSchema();
  const db = getTursoClient();

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
          GROUP BY access_code
        ) fr ON fr.access_code = ac.code
        ORDER BY total_encoded DESC, ac.code ASC
      `,
    }),
    db.execute({
      sql: `SELECT COUNT(*) AS total_encoded FROM faced_records`,
    }),
  ]);

  const summaries: EnumeratorSummary[] = codeResult.rows.map((row) => {
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
  });

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
