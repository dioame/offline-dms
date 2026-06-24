export type VerifySearchInput = {
  last_name: string;
  first_name: string;
  middle_name?: string;
  birthdate?: string;
  city_municipality?: string;
  barangay?: string;
};

export type VerifyMatch = {
  uuid: string;
  headName: string;
  lastName: string;
  firstName: string;
  middleName: string;
  birthdate: string;
  barangay: string;
  cityMunicipality: string;
  enumeratorName: string;
  dateRegistered: string;
  encodedAt: string;
  matchLabel: string;
};

export type VerifyCacheEntry = {
  uuid: string;
  first_name: string;
  last_name: string;
  middle_name: string;
  birthdate: string;
  barangay: string;
  city_municipality: string;
  enumerator_name: string;
  date_registered: string;
  encoded_at: string;
};

export function normField(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export function formatHeadName(parts: {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  name_extension?: string;
}): string {
  return [parts.first_name, parts.middle_name, parts.last_name, parts.name_extension]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

function matchLabel(
  head: { middle_name?: string; birthdate?: string },
  input: VerifySearchInput,
): string {
  const middleMatches =
    !normField(input.middle_name) ||
    normField(head.middle_name) === normField(input.middle_name);
  const birthdateMatches =
    !normField(input.birthdate) || normField(head.birthdate) === normField(input.birthdate);

  if (middleMatches && birthdateMatches) return "Exact name match";
  if (middleMatches) return "Same name (birthdate differs)";
  if (birthdateMatches) return "Same name (middle name differs)";
  return "Same first and last name";
}

export function entryToMatch(entry: VerifyCacheEntry, input: VerifySearchInput): VerifyMatch {
  return {
    uuid: entry.uuid,
    headName: formatHeadName(entry),
    lastName: entry.last_name,
    firstName: entry.first_name,
    middleName: entry.middle_name,
    birthdate: entry.birthdate,
    barangay: entry.barangay,
    cityMunicipality: entry.city_municipality,
    enumeratorName: entry.enumerator_name,
    dateRegistered: entry.date_registered,
    encodedAt: entry.encoded_at,
    matchLabel: matchLabel(entry, input),
  };
}

export function filterVerifyEntries(
  entries: VerifyCacheEntry[],
  input: VerifySearchInput,
): VerifyMatch[] {
  const lastName = normField(input.last_name);
  const firstName = normField(input.first_name);
  if (!lastName || !firstName) return [];

  const barangayFilter = normField(input.barangay);
  const municipalityFilter = normField(input.city_municipality);
  const birthdateFilter = normField(input.birthdate);

  const matches = entries
    .filter((entry) => {
      if (normField(entry.last_name) !== lastName) return false;
      if (normField(entry.first_name) !== firstName) return false;
      if (barangayFilter && normField(entry.barangay) !== barangayFilter) return false;
      if (municipalityFilter && normField(entry.city_municipality) !== municipalityFilter) {
        return false;
      }
      if (birthdateFilter && normField(entry.birthdate) !== birthdateFilter) return false;
      return true;
    })
    .map((entry) => entryToMatch(entry, input));

  matches.sort((a, b) => b.encodedAt.localeCompare(a.encodedAt));
  return matches;
}

export function formatDuplicateMatchSummary(
  match: VerifyMatch,
  province?: string,
): string {
  const location = [match.barangay, match.cityMunicipality, province]
    .filter(Boolean)
    .join(", ");
  const parts = [
    location,
    match.birthdate,
    match.enumeratorName ? `Encoder: ${match.enumeratorName}` : "",
    match.matchLabel,
  ].filter(Boolean);
  return parts.join(" · ");
}
