import type { Client } from "@libsql/client";
import { normalizeAccessCode } from "./code-generator";

function nameTokensKey(name: string): string | null {
  const tokens = name
    .trim()
    .toLowerCase()
    .replace(/[.,]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1)
    .sort();
  return tokens.length > 0 ? tokens.join(" ") : null;
}

export async function backfillFacedRecordAccessCodes(
  db: Client,
): Promise<number> {
  const [codeResult, recordResult] = await Promise.all([
    db.execute({
      sql: `
        SELECT code, enumerator_name, status
        FROM access_codes
        WHERE TRIM(COALESCE(enumerator_name, '')) != ''
      `,
    }),
    db.execute({
      sql: `
        SELECT uuid, enumerator_name
        FROM faced_records
        WHERE TRIM(COALESCE(access_code, '')) = ''
          AND TRIM(enumerator_name) != ''
          AND deleted_at IS NULL
      `,
    }),
  ]);

  const codeByTokens = new Map<string, { code: string; used: boolean }>();

  for (const row of codeResult.rows) {
    const code = String(row.code);
    const tokens = nameTokensKey(String(row.enumerator_name));
    if (!tokens) continue;

    const used = String(row.status) === "used";
    const existing = codeByTokens.get(tokens);
    if (!existing || (used && !existing.used)) {
      codeByTokens.set(tokens, { code, used });
    }
  }

  let updated = 0;

  for (const row of recordResult.rows) {
    const tokens = nameTokensKey(String(row.enumerator_name));
    if (!tokens) continue;

    const match = codeByTokens.get(tokens);
    if (!match) continue;

    await db.execute({
      sql: `UPDATE faced_records SET access_code = ? WHERE uuid = ? AND deleted_at IS NULL`,
      args: [match.code, String(row.uuid)],
    });
    updated += 1;
  }

  return updated;
}

export function normalizeRecordAccessCode(accessCode: string | undefined): string {
  const normalized = normalizeAccessCode(accessCode ?? "");
  return normalized || "";
}
