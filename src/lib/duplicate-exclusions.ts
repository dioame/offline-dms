import { ensureTursoSchema, getTursoClient } from "./turso";
import { duplicateExclusionsToCache } from "./duplicate-exclusion-rules";
import type {
  DuplicateExclusionCacheEntry,
  DuplicatePairExclusion,
} from "./duplicate-exclusion-types";

export type { DuplicateExclusionCacheEntry, DuplicatePairExclusion };
export {
  buildExcludedPairKeySet,
  buildHomonymVerifiedUuids,
  buildNameKey,
  canonicalPairKey,
  duplicateExclusionsToCache,
  filterMatchesWithExclusions,
  isStrongDuplicateMatch,
  shouldSuppressDuplicateMatch,
  splitRecordsByExclusions,
} from "./duplicate-exclusion-rules";

function parseExclusionRow(row: Record<string, unknown>): DuplicatePairExclusion {
  return {
    id: Number(row.id),
    uuid_a: String(row.uuid_a),
    uuid_b: String(row.uuid_b),
    name_key: String(row.name_key),
    excluded_at: String(row.excluded_at),
    excluded_by: String(row.excluded_by ?? "admin"),
    note: String(row.note ?? ""),
  };
}

export async function listDuplicatePairExclusions(): Promise<DuplicatePairExclusion[]> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const result = await db.execute({
    sql: `
      SELECT id, uuid_a, uuid_b, name_key, excluded_at, excluded_by, note
      FROM duplicate_pair_exclusions
      ORDER BY excluded_at DESC, id DESC
    `,
  });

  return result.rows.map((row) => parseExclusionRow(row as Record<string, unknown>));
}

export async function listDuplicatePairExclusionsForNameKeys(
  nameKeys: string[],
): Promise<DuplicatePairExclusion[]> {
  if (nameKeys.length === 0) return [];

  await ensureTursoSchema();
  const db = getTursoClient();
  const placeholders = nameKeys.map(() => "?").join(", ");
  const result = await db.execute({
    sql: `
      SELECT id, uuid_a, uuid_b, name_key, excluded_at, excluded_by, note
      FROM duplicate_pair_exclusions
      WHERE name_key IN (${placeholders})
    `,
    args: nameKeys,
  });

  return result.rows.map((row) => parseExclusionRow(row as Record<string, unknown>));
}

export async function createDuplicatePairExclusions(input: {
  uuids: string[];
  nameKey: string;
  note?: string;
}): Promise<DuplicatePairExclusion[]> {
  const uuids = [...new Set(input.uuids.map((uuid) => uuid.trim()).filter(Boolean))];
  if (uuids.length < 2) {
    throw new Error("At least two record UUIDs are required.");
  }

  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < uuids.length; i += 1) {
    for (let j = i + 1; j < uuids.length; j += 1) {
      const a = uuids[i];
      const b = uuids[j];
      pairs.push(a < b ? [a, b] : [b, a]);
    }
  }

  if (pairs.length === 0) {
    throw new Error("No duplicate pairs to exclude.");
  }

  await ensureTursoSchema();
  const db = getTursoClient();
  const excludedAt = new Date().toISOString();
  const created: DuplicatePairExclusion[] = [];

  for (const [uuidA, uuidB] of pairs) {
    await db.execute({
      sql: `
        INSERT INTO duplicate_pair_exclusions (
          uuid_a, uuid_b, name_key, excluded_at, excluded_by, note
        ) VALUES (?, ?, ?, ?, 'admin', ?)
        ON CONFLICT(uuid_a, uuid_b) DO NOTHING
      `,
      args: [uuidA, uuidB, input.nameKey, excludedAt, input.note?.trim() ?? ""],
    });

    const lookup = await db.execute({
      sql: `
        SELECT id, uuid_a, uuid_b, name_key, excluded_at, excluded_by, note
        FROM duplicate_pair_exclusions
        WHERE uuid_a = ? AND uuid_b = ?
      `,
      args: [uuidA, uuidB],
    });

    const row = lookup.rows[0];
    if (row) {
      created.push(parseExclusionRow(row as Record<string, unknown>));
    }
  }

  return created;
}
