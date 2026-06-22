import { ensureTursoSchema, getTursoClient } from "./turso";

export type EnumeratorSummary = {
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

function normName(name: string | null | undefined): string {
  return (name ?? "").trim().toLowerCase();
}

function summaryKey(name: string, email: string | null): string {
  const normalizedName = normName(name);
  if (normalizedName) return `name:${normalizedName}`;
  if (email) return `email:${email.trim().toLowerCase()}`;
  return "unassigned";
}

function laterIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

export async function getEnumeratorSummaries(): Promise<{
  summaries: EnumeratorSummary[];
  totals: EnumeratorSummaryTotals;
}> {
  await ensureTursoSchema();
  const db = getTursoClient();

  const [recordResult, codeResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT
          enumerator_name,
          COUNT(*) AS total_encoded,
          MAX(updated_at) AS last_encoded_at
        FROM faced_records
        WHERE TRIM(enumerator_name) != ''
        GROUP BY LOWER(TRIM(enumerator_name)), enumerator_name
      `,
    }),
    db.execute({
      sql: `
        SELECT
          enumerator_name,
          enumerator_email,
          COUNT(*) AS total_codes,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_codes,
          SUM(CASE WHEN status = 'used' THEN 1 ELSE 0 END) AS used_codes,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected_codes,
          MAX(last_used_at) AS last_used_at
        FROM access_codes
        WHERE TRIM(COALESCE(enumerator_name, '')) != ''
           OR TRIM(COALESCE(enumerator_email, '')) != ''
        GROUP BY
          LOWER(TRIM(COALESCE(enumerator_name, ''))),
          LOWER(TRIM(COALESCE(enumerator_email, ''))),
          enumerator_name,
          enumerator_email
      `,
    }),
  ]);

  const byKey = new Map<string, EnumeratorSummary>();

  function upsert(name: string, email: string | null): EnumeratorSummary {
    const key = summaryKey(name, email);
    let row = byKey.get(key);
    if (!row) {
      row = {
        enumerator_name: name || email || "Unassigned",
        enumerator_email: email,
        total_encoded: 0,
        total_codes: 0,
        active_codes: 0,
        used_codes: 0,
        rejected_codes: 0,
        last_encoded_at: null,
        last_used_at: null,
      };
      byKey.set(key, row);
      return row;
    }

    if (name && row.enumerator_name === "Unassigned") {
      row.enumerator_name = name;
    }
    if (email && !row.enumerator_email) {
      row.enumerator_email = email;
    }
    return row;
  }

  for (const row of codeResult.rows) {
    const name = row.enumerator_name ? String(row.enumerator_name).trim() : "";
    const email = row.enumerator_email ? String(row.enumerator_email).trim() : null;
    const summary = upsert(name || email || "Unassigned", email);
    summary.total_codes += Number(row.total_codes);
    summary.active_codes += Number(row.active_codes);
    summary.used_codes += Number(row.used_codes);
    summary.rejected_codes += Number(row.rejected_codes);
    summary.last_used_at = laterIso(
      summary.last_used_at,
      row.last_used_at ? String(row.last_used_at) : null,
    );
  }

  for (const row of recordResult.rows) {
    const name = String(row.enumerator_name).trim();
    const summary = upsert(name, null);
    summary.total_encoded += Number(row.total_encoded);
    summary.last_encoded_at = laterIso(
      summary.last_encoded_at,
      row.last_encoded_at ? String(row.last_encoded_at) : null,
    );
  }

  const summaries = Array.from(byKey.values()).sort((a, b) => {
    if (b.total_encoded !== a.total_encoded) {
      return b.total_encoded - a.total_encoded;
    }
    return a.enumerator_name.localeCompare(b.enumerator_name);
  });

  const totals = summaries.reduce<EnumeratorSummaryTotals>(
    (acc, row) => ({
      enumerators: acc.enumerators + 1,
      total_encoded: acc.total_encoded + row.total_encoded,
      total_codes: acc.total_codes + row.total_codes,
      active_codes: acc.active_codes + row.active_codes,
      used_codes: acc.used_codes + row.used_codes,
      rejected_codes: acc.rejected_codes + row.rejected_codes,
    }),
    {
      enumerators: 0,
      total_encoded: 0,
      total_codes: 0,
      active_codes: 0,
      used_codes: 0,
      rejected_codes: 0,
    },
  );

  return { summaries, totals };
}
