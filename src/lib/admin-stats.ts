import { ensureTursoSchema, getTursoClient } from "./turso";

export type EnumeratorSummary = {
  access_code: string | null;
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

function nameTokensKey(name: string): string | null {
  const tokens = name
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .sort();
  return tokens.length > 0 ? tokens.join(" ") : null;
}

function laterIso(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

function createEmptySummary(
  accessCode: string | null,
  name: string,
  email: string | null,
): EnumeratorSummary {
  return {
    access_code: accessCode,
    enumerator_name: name,
    enumerator_email: email,
    total_encoded: 0,
    total_codes: 0,
    active_codes: 0,
    used_codes: 0,
    rejected_codes: 0,
    last_encoded_at: null,
    last_used_at: null,
  };
}

export async function getEnumeratorSummaries(): Promise<{
  summaries: EnumeratorSummary[];
  totals: EnumeratorSummaryTotals;
}> {
  await ensureTursoSchema();
  const db = getTursoClient();

  const [codeResult, recordResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT
          code,
          enumerator_name,
          enumerator_email,
          status,
          last_used_at
        FROM access_codes
        ORDER BY created_at DESC
      `,
    }),
    db.execute({
      sql: `
        SELECT
          enumerator_name,
          COUNT(*) AS total_encoded,
          MAX(updated_at) AS last_encoded_at
        FROM faced_records
        WHERE TRIM(enumerator_name) != ''
        GROUP BY enumerator_name
      `,
    }),
  ]);

  const byCode = new Map<string, EnumeratorSummary>();
  const codeByNameTokens = new Map<string, string>();

  for (const row of codeResult.rows) {
    const code = String(row.code);
    const name = row.enumerator_name ? String(row.enumerator_name).trim() : "";
    const email = row.enumerator_email ? String(row.enumerator_email).trim() : null;
    const status = String(row.status);

    const summary = createEmptySummary(
      code,
      name || email || "Unassigned",
      email,
    );
    summary.total_codes = 1;
    if (status === "active") summary.active_codes = 1;
    if (status === "used") summary.used_codes = 1;
    if (status === "rejected") summary.rejected_codes = 1;
    summary.last_used_at = row.last_used_at ? String(row.last_used_at) : null;

    byCode.set(code, summary);

    const tokens = nameTokensKey(name);
    if (tokens) {
      const existingCode = codeByNameTokens.get(tokens);
      const existing = existingCode ? byCode.get(existingCode) : undefined;
      const preferCurrent =
        !existing ||
        (summary.used_codes === 1 && existing.used_codes !== 1);
      if (preferCurrent) {
        codeByNameTokens.set(tokens, code);
      }
    }
  }

  const unmatched = createEmptySummary(null, "Unmatched encodings", null);

  for (const row of recordResult.rows) {
    const name = String(row.enumerator_name).trim();
    const encoded = Number(row.total_encoded);
    const lastEncodedAt = row.last_encoded_at ? String(row.last_encoded_at) : null;
    const tokens = nameTokensKey(name);
    const code = tokens ? codeByNameTokens.get(tokens) : undefined;
    const summary = code ? byCode.get(code) : undefined;

    if (summary) {
      summary.total_encoded += encoded;
      summary.last_encoded_at = laterIso(summary.last_encoded_at, lastEncodedAt);
    } else {
      unmatched.total_encoded += encoded;
      unmatched.last_encoded_at = laterIso(unmatched.last_encoded_at, lastEncodedAt);
    }
  }

  const summaries = Array.from(byCode.values());
  if (unmatched.total_encoded > 0) {
    summaries.push(unmatched);
  }

  summaries.sort((a, b) => {
    if (b.total_encoded !== a.total_encoded) {
      return b.total_encoded - a.total_encoded;
    }
    return (a.enumerator_name || "").localeCompare(b.enumerator_name || "");
  });

  const totals = summaries.reduce<EnumeratorSummaryTotals>(
    (acc, row) => ({
      enumerators: acc.enumerators + (row.access_code ? 1 : 0),
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
