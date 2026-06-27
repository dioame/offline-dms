import type { DuplicateExclusionCacheEntry } from "./duplicate-exclusion-types";
import {
  buildNameKey,
  filterMatchesWithExclusions,
} from "./duplicate-exclusion-rules";
import type { DuplicatePairExclusion } from "./duplicate-exclusion-types";
import type { VerifyMatch, VerifySearchInput } from "./verify-match";
import { db } from "./db";

export async function clearDuplicateExclusionsCache(): Promise<void> {
  await db.duplicate_exclusions_cache.clear();
}

export async function getAllDuplicateExclusionsCache(): Promise<DuplicateExclusionCacheEntry[]> {
  return db.duplicate_exclusions_cache.toArray();
}

async function loadCachedExclusionsForInput(
  input: VerifySearchInput,
): Promise<DuplicatePairExclusion[]> {
  const nameKey = buildNameKey(input.last_name, input.first_name);
  const cached = await getAllDuplicateExclusionsCache();
  return cached
    .filter((entry) => entry.name_key === nameKey)
    .map((entry, index) => ({
      id: index,
      uuid_a: entry.uuid_a,
      uuid_b: entry.uuid_b,
      name_key: entry.name_key,
      excluded_at: "",
      excluded_by: "cache",
      note: "",
    }));
}

export async function filterCachedMatchesWithExclusions(
  matches: VerifyMatch[],
  input: VerifySearchInput,
  candidateUuid?: string,
): Promise<VerifyMatch[]> {
  const exclusions = await loadCachedExclusionsForInput(input);
  return filterMatchesWithExclusions(matches, input, exclusions, candidateUuid);
}

export async function saveDuplicateExclusionsCache(
  exclusions: DuplicateExclusionCacheEntry[],
): Promise<void> {
  await clearDuplicateExclusionsCache();
  if (exclusions.length > 0) {
    await db.duplicate_exclusions_cache.bulkPut(exclusions);
  }
}
