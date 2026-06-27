import { getAuthSession, getFacedRecords } from "./db";
import type { FacedRecord } from "./faced-types";
import {
  filterCachedMatchesWithExclusions,
  getAllDuplicateExclusionsCache,
} from "./duplicate-exclusions-cache";
import {
  buildNameKey,
  filterMatchesWithExclusions,
} from "./duplicate-exclusion-rules";
import type { DuplicatePairExclusion } from "./duplicate-exclusion-types";
import {
  getAllVerifyCacheEntries,
  getVerifyCacheCount,
  searchCachedBeneficiary,
} from "./verify-cache";
import {
  filterVerifyEntries,
  type VerifyCacheEntry,
  type VerifyMatch,
  type VerifySearchInput,
} from "./verify-match";

export type EncodeDuplicateCheckResult = {
  matches: VerifyMatch[];
  source: "online" | "offline" | "local" | null;
  canCheck: boolean;
};

export type EncodeDuplicateCheckOptions = {
  excludeUuid?: string;
  excludeEditId?: number;
};

function facedRecordToEntry(record: FacedRecord): VerifyCacheEntry {
  return {
    uuid: record.uuid,
    first_name: record.head_of_family.first_name,
    last_name: record.head_of_family.last_name,
    middle_name: record.head_of_family.middle_name,
    birthdate: record.head_of_family.birthdate,
    barangay: record.barangay,
    city_municipality: record.city_municipality,
    enumerator_name: record.enumerator_name,
    date_registered: record.date_registered,
    encoded_at: record.updatedAt.toISOString(),
  };
}

function mergeMatches(lists: VerifyMatch[][]): VerifyMatch[] {
  const byUuid = new Map<string, VerifyMatch>();
  for (const list of lists) {
    for (const match of list) {
      if (!byUuid.has(match.uuid)) {
        byUuid.set(match.uuid, match);
      }
    }
  }
  return [...byUuid.values()].sort((a, b) => b.encodedAt.localeCompare(a.encodedAt));
}

async function loadLocalDuplicateExclusions(
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

function applyExclusions(
  matches: VerifyMatch[],
  input: VerifySearchInput,
  exclusions: DuplicatePairExclusion[],
  candidateUuid?: string,
): VerifyMatch[] {
  if (exclusions.length === 0) return matches;
  return filterMatchesWithExclusions(matches, input, exclusions, candidateUuid);
}

async function searchLocalFacedRecords(
  input: VerifySearchInput,
  options: EncodeDuplicateCheckOptions,
  exclusions: DuplicatePairExclusion[],
): Promise<VerifyMatch[]> {
  const records = await getFacedRecords();
  const entries = records
    .filter((record) => {
      if (options.excludeEditId && record.id === options.excludeEditId) return false;
      if (options.excludeUuid && record.uuid === options.excludeUuid) return false;
      return true;
    })
    .map(facedRecordToEntry);

  return applyExclusions(
    filterVerifyEntries(entries, input),
    input,
    exclusions,
    options.excludeUuid,
  );
}

async function searchOnlineDuplicates(
  input: VerifySearchInput,
  options: EncodeDuplicateCheckOptions,
): Promise<VerifyMatch[]> {
  const session = await getAuthSession();
  if (!session?.code || !session.sessionId) {
    return [];
  }

  const res = await fetch("/api/encode/duplicate-check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: session.code,
      sessionId: session.sessionId,
      ...input,
      exclude_uuid: options.excludeUuid,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Duplicate check failed.");
  }

  return (data.matches ?? []) as VerifyMatch[];
}

export async function checkEncodingDuplicates(
  input: VerifySearchInput,
  options: EncodeDuplicateCheckOptions = {},
): Promise<EncodeDuplicateCheckResult> {
  const lastName = input.last_name.trim();
  const firstName = input.first_name.trim();
  if (!lastName || !firstName) {
    return { matches: [], source: null, canCheck: false };
  }

  const exclusions = await loadLocalDuplicateExclusions(input);
  const localMatches = await searchLocalFacedRecords(input, options, exclusions);
  const isOnline = typeof navigator !== "undefined" && navigator.onLine;

  if (isOnline) {
    try {
      const onlineMatches = await searchOnlineDuplicates(input, options);
      const matches = applyExclusions(
        mergeMatches([onlineMatches, localMatches]),
        input,
        exclusions,
        options.excludeUuid,
      );
      return {
        matches,
        source: "online",
        canCheck: true,
      };
    } catch {
      const cacheCount = await getVerifyCacheCount();
      if (cacheCount > 0) {
        const entries = await getAllVerifyCacheEntries();
        const cached = await filterCachedMatchesWithExclusions(
          searchCachedBeneficiary(entries, input).matches.filter(
            (match) => match.uuid !== options.excludeUuid,
          ),
          input,
          options.excludeUuid,
        );
        const matches = mergeMatches([cached, localMatches]);
        return {
          matches,
          source: "offline",
          canCheck: true,
        };
      }

      return { matches: [], source: null, canCheck: false };
    }
  }

  const cacheCount = await getVerifyCacheCount();
  if (cacheCount > 0) {
    const entries = await getAllVerifyCacheEntries();
    const cached = await filterCachedMatchesWithExclusions(
      searchCachedBeneficiary(entries, input).matches.filter(
        (match) => match.uuid !== options.excludeUuid,
      ),
      input,
      options.excludeUuid,
    );
    const matches = mergeMatches([cached, localMatches]);
    return {
      matches,
      source: "offline",
      canCheck: true,
    };
  }

  return { matches: [], source: null, canCheck: false };
}
