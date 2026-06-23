import { ensureTursoSchema, getTursoClient } from "./turso";
import {
  filterVerifyEntries,
  normField,
  type VerifyCacheEntry,
  type VerifyMatch,
  type VerifySearchInput,
} from "./verify-match";

export type { VerifyMatch, VerifySearchInput };

export type VerifySearchResult = {
  matches: VerifyMatch[];
  searchedAt: string;
  source: "online";
};

function rowToEntry(row: Record<string, unknown>): VerifyCacheEntry | null {
  let payload: {
    head_of_family?: {
      first_name?: string;
      last_name?: string;
      middle_name?: string;
      birthdate?: string;
    };
    city_municipality?: string;
  };

  try {
    payload = JSON.parse(String(row.payload)) as typeof payload;
  } catch {
    return null;
  }

  const head = payload.head_of_family ?? {};

  return {
    uuid: String(row.uuid),
    first_name: head.first_name?.trim() ?? "",
    last_name: head.last_name?.trim() ?? "",
    middle_name: head.middle_name?.trim() ?? "",
    birthdate: head.birthdate?.trim() ?? "",
    barangay: String(row.barangay ?? "").trim(),
    city_municipality: String(
      row.city_municipality ?? payload.city_municipality ?? "",
    ).trim(),
    enumerator_name: String(row.enumerator_name ?? "").trim(),
    date_registered: String(row.date_registered ?? "").trim(),
    encoded_at: String(row.updated_at ?? ""),
  };
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
    args: [normField(lastName), normField(firstName)],
  });

  const entries = result.rows
    .map((row) => rowToEntry(row as Record<string, unknown>))
    .filter((entry): entry is VerifyCacheEntry => entry !== null);

  return {
    matches: filterVerifyEntries(entries, input),
    searchedAt: new Date().toISOString(),
    source: "online",
  };
}
