import { normField, type VerifyCacheEntry, type VerifyMatch, type VerifySearchInput } from "./verify-match";
import type { DuplicatePairExclusion } from "./duplicate-exclusion-types";

export function buildNameKey(lastName: string, firstName: string): string {
  return `${normField(lastName)}|${normField(firstName)}`;
}

export function canonicalPairKey(uuidA: string, uuidB: string): string {
  const a = uuidA.trim();
  const b = uuidB.trim();
  if (!a || !b || a === b) return "";
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function isStrongDuplicateMatch(
  input: VerifySearchInput,
  entry: Pick<VerifyCacheEntry, "middle_name" | "birthdate">,
): boolean {
  const inputMiddle = normField(input.middle_name);
  const inputBirthdate = normField(input.birthdate);
  const entryMiddle = normField(entry.middle_name);
  const entryBirthdate = normField(entry.birthdate);

  const middleMatches = Boolean(inputMiddle && entryMiddle && inputMiddle === entryMiddle);
  const birthdateMatches = Boolean(
    inputBirthdate && entryBirthdate && inputBirthdate === entryBirthdate,
  );

  if (middleMatches && birthdateMatches) return true;
  if (inputBirthdate && birthdateMatches) return true;
  if (inputMiddle && middleMatches) return true;
  return false;
}

export function buildExcludedPairKeySet(
  exclusions: Pick<DuplicatePairExclusion, "uuid_a" | "uuid_b">[],
): Set<string> {
  const keys = new Set<string>();
  for (const exclusion of exclusions) {
    const key = canonicalPairKey(exclusion.uuid_a, exclusion.uuid_b);
    if (key) keys.add(key);
  }
  return keys;
}

export function buildHomonymVerifiedUuids(
  nameKey: string,
  exclusions: Pick<DuplicatePairExclusion, "name_key" | "uuid_a" | "uuid_b">[],
): Set<string> {
  const uuids = new Set<string>();
  for (const exclusion of exclusions) {
    if (exclusion.name_key !== nameKey) continue;
    uuids.add(exclusion.uuid_a);
    uuids.add(exclusion.uuid_b);
  }
  return uuids;
}

export function shouldSuppressDuplicateMatch(
  input: VerifySearchInput,
  entry: VerifyCacheEntry,
  exclusions: DuplicatePairExclusion[],
  candidateUuid?: string,
): boolean {
  const nameKey = buildNameKey(input.last_name, input.first_name);
  const excludedPairs = buildExcludedPairKeySet(exclusions);

  if (candidateUuid) {
    const pairKey = canonicalPairKey(candidateUuid, entry.uuid);
    if (pairKey && excludedPairs.has(pairKey)) return true;
  }

  const homonymVerified = buildHomonymVerifiedUuids(nameKey, exclusions);
  if (homonymVerified.has(entry.uuid)) {
    return !isStrongDuplicateMatch(input, entry);
  }

  return false;
}

export function filterMatchesWithExclusions(
  matches: VerifyMatch[],
  input: VerifySearchInput,
  exclusions: DuplicatePairExclusion[],
  candidateUuid?: string,
): VerifyMatch[] {
  if (exclusions.length === 0) return matches;

  const entriesByUuid = new Map<string, VerifyCacheEntry>();
  for (const match of matches) {
    entriesByUuid.set(match.uuid, {
      uuid: match.uuid,
      first_name: match.firstName,
      last_name: match.lastName,
      middle_name: match.middleName,
      birthdate: match.birthdate,
      barangay: match.barangay,
      city_municipality: match.cityMunicipality,
      enumerator_name: match.enumeratorName,
      date_registered: match.dateRegistered,
      encoded_at: match.encodedAt,
    });
  }

  return matches.filter((match) => {
    const entry = entriesByUuid.get(match.uuid);
    if (!entry) return true;
    return !shouldSuppressDuplicateMatch(input, entry, exclusions, candidateUuid);
  });
}

export function splitRecordsByExclusions<T extends { uuid: string }>(
  records: T[],
  excludedPairs: Set<string>,
): T[][] {
  if (records.length < 2) return [];

  const uuids = records.map((record) => record.uuid);
  const adjacency = new Map<string, Set<string>>();
  for (const uuid of uuids) {
    adjacency.set(uuid, new Set());
  }

  for (let i = 0; i < uuids.length; i += 1) {
    for (let j = i + 1; j < uuids.length; j += 1) {
      const pairKey = canonicalPairKey(uuids[i], uuids[j]);
      if (pairKey && !excludedPairs.has(pairKey)) {
        adjacency.get(uuids[i])!.add(uuids[j]);
        adjacency.get(uuids[j])!.add(uuids[i]);
      }
    }
  }

  const visited = new Set<string>();
  const components: T[][] = [];
  const byUuid = new Map(records.map((record) => [record.uuid, record]));

  for (const uuid of uuids) {
    if (visited.has(uuid)) continue;

    const queue = [uuid];
    const component: T[] = [];
    visited.add(uuid);

    while (queue.length > 0) {
      const current = queue.shift()!;
      component.push(byUuid.get(current)!);
      for (const neighbor of adjacency.get(current) ?? []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    if (component.length >= 2) {
      components.push(component);
    }
  }

  return components;
}

export function duplicateExclusionsToCache(
  exclusions: DuplicatePairExclusion[],
): import("./duplicate-exclusion-types").DuplicateExclusionCacheEntry[] {
  return exclusions.map((exclusion) => ({
    pair_key: canonicalPairKey(exclusion.uuid_a, exclusion.uuid_b),
    uuid_a: exclusion.uuid_a,
    uuid_b: exclusion.uuid_b,
    name_key: exclusion.name_key,
  }));
}
