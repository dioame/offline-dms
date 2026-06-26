import {
  evacuationSiteSuggestions as staticEvacuationSiteSuggestions,
  formatDisplayBarangay,
  isSaranganiMunicipality,
} from "./sarangani-locations";
import { ensureTursoSchema, getTursoClient } from "./turso";

export type EcLibraryRow = {
  id: number;
  city_municipality: string;
  barangay: string;
  site_name: string;
  created_at: string;
  updated_at: string;
};

function rowToEcLibrary(row: Record<string, unknown>): EcLibraryRow {
  return {
    id: Number(row.id),
    city_municipality: String(row.city_municipality),
    barangay: String(row.barangay),
    site_name: String(row.site_name),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function normalizeSiteName(siteName: string): string {
  return siteName.trim().replace(/\s+/g, " ");
}

function normalizeMunicipality(cityMunicipality: string): string {
  const trimmed = cityMunicipality.trim();
  if (!trimmed) return "";
  if (isSaranganiMunicipality(trimmed)) return trimmed;
  const match = trimmed
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return match;
}

function mergeSuggestions(...lists: readonly string[][]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const list of lists) {
    for (const item of list) {
      const trimmed = item.trim();
      if (!trimmed) continue;
      const key = trimmed.toUpperCase();
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(trimmed);
    }
  }
  return merged.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export async function listEcLibrary(filters?: {
  city_municipality?: string;
  barangay?: string;
}): Promise<EcLibraryRow[]> {
  await ensureTursoSchema();
  const db = getTursoClient();

  const clauses: string[] = [];
  const args: string[] = [];

  if (filters?.city_municipality?.trim()) {
    clauses.push("city_municipality = ?");
    args.push(normalizeMunicipality(filters.city_municipality));
  }
  if (filters?.barangay?.trim()) {
    clauses.push("barangay = ?");
    args.push(
      formatDisplayBarangay(filters.barangay, filters.city_municipality),
    );
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";

  const result = await db.execute({
    sql: `
      SELECT id, city_municipality, barangay, site_name, created_at, updated_at
      FROM ec_library
      ${where}
      ORDER BY city_municipality ASC, barangay ASC, site_name ASC
    `,
    args,
  });

  return result.rows.map((row) => rowToEcLibrary(row as Record<string, unknown>));
}

export async function addEcLibrarySite(input: {
  city_municipality: string;
  barangay: string;
  site_name: string;
}): Promise<EcLibraryRow> {
  const city_municipality = normalizeMunicipality(input.city_municipality);
  const barangay = formatDisplayBarangay(input.barangay, city_municipality);
  const site_name = normalizeSiteName(input.site_name);

  if (!city_municipality) {
    throw new Error("Municipality is required.");
  }
  if (!barangay) {
    throw new Error("Barangay is required.");
  }
  if (!site_name) {
    throw new Error("Evacuation site name is required.");
  }

  await ensureTursoSchema();
  const db = getTursoClient();
  const now = new Date().toISOString();

  try {
    const result = await db.execute({
      sql: `
        INSERT INTO ec_library (city_municipality, barangay, site_name, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `,
      args: [city_municipality, barangay, site_name, now, now],
    });

    const id = Number(result.lastInsertRowid);
    const rows = await db.execute({
      sql: `
        SELECT id, city_municipality, barangay, site_name, created_at, updated_at
        FROM ec_library
        WHERE id = ?
      `,
      args: [id],
    });

    const row = rows.rows[0];
    if (!row) {
      throw new Error("Site could not be loaded after save.");
    }
    return rowToEcLibrary(row as Record<string, unknown>);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.toLowerCase().includes("unique")) {
      throw new Error("This evacuation site already exists for the selected barangay.");
    }
    throw err;
  }
}

export async function deleteEcLibrarySite(id: number): Promise<void> {
  if (!Number.isFinite(id) || id <= 0) {
    throw new Error("Invalid site id.");
  }

  await ensureTursoSchema();
  const db = getTursoClient();

  const result = await db.execute({
    sql: "DELETE FROM ec_library WHERE id = ?",
    args: [id],
  });

  if (result.rowsAffected === 0) {
    throw new Error("Evacuation site not found.");
  }
}

export async function listEvacuationSiteSuggestions(
  cityMunicipality: string,
  barangay?: string,
): Promise<string[]> {
  const municipality = normalizeMunicipality(cityMunicipality);
  if (!municipality) {
    return [];
  }

  const trimmedBarangay = barangay?.trim();

  try {
    if (trimmedBarangay) {
      const librarySites = await listEcLibrary({
        city_municipality: municipality,
        barangay: trimmedBarangay,
      });
      return mergeSuggestions(librarySites.map((row) => row.site_name));
    }

    const staticSites = [...staticEvacuationSiteSuggestions(municipality)];
    const librarySites = await listEcLibrary({ city_municipality: municipality });
    return mergeSuggestions(
      staticSites,
      librarySites.map((row) => row.site_name),
    );
  } catch {
    if (trimmedBarangay) {
      return [];
    }
    return mergeSuggestions([...staticEvacuationSiteSuggestions(municipality)]);
  }
}
