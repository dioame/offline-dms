import { getAuthSession, getFacedRecords } from "./db";
import type { FacedRecord } from "./faced-types";
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

async function searchLocalFacedRecords(
  input: VerifySearchInput,
  options: EncodeDuplicateCheckOptions,
): Promise<VerifyMatch[]> {
  const records = await getFacedRecords();
  const entries = records
    .filter((record) => {
      if (options.excludeEditId && record.id === options.excludeEditId) return false;
      if (options.excludeUuid && record.uuid === options.excludeUuid) return false;
      return true;
    })
    .map(facedRecordToEntry);

  return filterVerifyEntries(entries, input);
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

  const localMatches = await searchLocalFacedRecords(input, options);
  const isOnline = typeof navigator !== "undefined" && navigator.onLine;

  if (isOnline) {
    try {
      const onlineMatches = await searchOnlineDuplicates(input, options);
      const matches = mergeMatches([onlineMatches, localMatches]);
      return {
        matches,
        source: "online",
        canCheck: true,
      };
    } catch {
      const cacheCount = await getVerifyCacheCount();
      if (cacheCount > 0) {
        const entries = await getAllVerifyCacheEntries();
        const cached = searchCachedBeneficiary(entries, input).matches.filter(
          (match) => match.uuid !== options.excludeUuid,
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
    const cached = searchCachedBeneficiary(entries, input).matches.filter(
      (match) => match.uuid !== options.excludeUuid,
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
