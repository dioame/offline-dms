import { ensureTursoSchema, getTursoClient } from "./turso";

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

export type VerifySearchResult = {
  matches: VerifyMatch[];
  searchedAt: string;
};

function norm(value: string | undefined | null): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function formatHeadName(head: {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  name_extension?: string;
}): string {
  const parts = [
    head.first_name,
    head.middle_name,
    head.last_name,
    head.name_extension,
  ]
    .map((part) => (part ?? "").trim())
    .filter(Boolean);
  return parts.join(" ");
}

function matchLabel(
  head: {
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    birthdate?: string;
  },
  input: VerifySearchInput,
): string {
  const middleMatches =
    !norm(input.middle_name) ||
    norm(head.middle_name) === norm(input.middle_name);
  const birthdateMatches =
    !norm(input.birthdate) || norm(head.birthdate) === norm(input.birthdate);

  if (middleMatches && birthdateMatches) {
    return "Exact name match";
  }
  if (middleMatches) {
    return "Same name (birthdate differs)";
  }
  if (birthdateMatches) {
    return "Same name (middle name differs)";
  }
  return "Same first and last name";
}

export async function searchEncodedBeneficiary(
  input: VerifySearchInput,
): Promise<VerifySearchResult> {
  const lastName = input.last_name.trim();
  const firstName = input.first_name.trim();

  if (!lastName || !firstName) {
    throw new Error("Last name and first name are required.");
  }

  await ensureTursoSchema();
  const db = getTursoClient();

  const result = await db.execute({
    sql: `
      SELECT
        uuid,
        barangay,
        city_municipality,
        enumerator_name,
        date_registered,
        updated_at,
        payload
      FROM faced_records
      WHERE LOWER(TRIM(json_extract(payload, '$.head_of_family.last_name'))) = ?
        AND LOWER(TRIM(json_extract(payload, '$.head_of_family.first_name'))) = ?
    `,
    args: [norm(lastName), norm(firstName)],
  });

  const barangayFilter = norm(input.barangay);
  const municipalityFilter = norm(input.city_municipality);
  const birthdateFilter = norm(input.birthdate);

  const matches: VerifyMatch[] = [];

  for (const row of result.rows) {
    let payload: {
      head_of_family?: {
        last_name?: string;
        first_name?: string;
        middle_name?: string;
        name_extension?: string;
        birthdate?: string;
      };
      city_municipality?: string;
    };

    try {
      payload = JSON.parse(String(row.payload)) as typeof payload;
    } catch {
      continue;
    }

    const head = payload.head_of_family ?? {};
    const recordBarangay = String(row.barangay ?? "").trim();
    const recordMunicipality = String(
      row.city_municipality ?? payload.city_municipality ?? "",
    ).trim();

    if (barangayFilter && norm(recordBarangay) !== barangayFilter) {
      continue;
    }
    if (municipalityFilter && norm(recordMunicipality) !== municipalityFilter) {
      continue;
    }
    if (birthdateFilter && norm(head.birthdate) !== birthdateFilter) {
      continue;
    }

    matches.push({
      uuid: String(row.uuid),
      headName: formatHeadName(head),
      lastName: head.last_name?.trim() ?? "",
      firstName: head.first_name?.trim() ?? "",
      middleName: head.middle_name?.trim() ?? "",
      birthdate: head.birthdate?.trim() ?? "",
      barangay: recordBarangay,
      cityMunicipality: recordMunicipality,
      enumeratorName: String(row.enumerator_name ?? "").trim(),
      dateRegistered: String(row.date_registered ?? "").trim(),
      encodedAt: String(row.updated_at ?? ""),
      matchLabel: matchLabel(head, input),
    });
  }

  matches.sort((a, b) => b.encodedAt.localeCompare(a.encodedAt));

  return {
    matches,
    searchedAt: new Date().toISOString(),
  };
}
