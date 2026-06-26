import { db } from "./db";
import type { EcLibraryCacheEntry, EncodeOfflineMeta } from "./encode-offline-types";
import {
  evacuationSiteSuggestions as staticEvacuationSiteSuggestions,
  formatDisplayBarangay,
} from "./sarangani-locations";

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

function normalizeMunicipality(value: string): string {
  return value.trim();
}

export async function getEncodeOfflineMeta(): Promise<EncodeOfflineMeta | undefined> {
  return db.encode_offline_meta.get("current");
}

export async function saveEncodeOfflineMeta(meta: EncodeOfflineMeta): Promise<void> {
  await db.encode_offline_meta.put(meta);
}

export async function getEcLibraryCacheCount(): Promise<number> {
  return db.ec_library_cache.count();
}

export async function clearEcLibraryCache(): Promise<void> {
  await db.ec_library_cache.clear();
}

export async function saveEcLibraryCache(entries: EcLibraryCacheEntry[]): Promise<void> {
  await clearEcLibraryCache();
  if (entries.length > 0) {
    await db.ec_library_cache.bulkPut(entries);
  }
}

export async function needsEncodeOfflineDownload(): Promise<boolean> {
  const [familyCount, ecCount] = await Promise.all([
    db.verify_cache.count(),
    db.ec_library_cache.count(),
  ]);
  return familyCount === 0 || ecCount === 0;
}

export async function listCachedEcSuggestions(
  cityMunicipality: string,
  barangay?: string,
): Promise<string[]> {
  const municipality = normalizeMunicipality(cityMunicipality);
  if (!municipality) return [];

  const trimmedBarangay = barangay?.trim();
  const allRows = await db.ec_library_cache
    .where("city_municipality")
    .equals(municipality)
    .toArray();

  if (trimmedBarangay) {
    const displayBarangay = formatDisplayBarangay(trimmedBarangay, municipality);
    const librarySites = allRows
      .filter(
        (row) =>
          row.barangay.trim().toUpperCase() === displayBarangay.toUpperCase() ||
          row.barangay.trim().toUpperCase() === trimmedBarangay.toUpperCase(),
      )
      .map((row) => row.site_name);
    return mergeSuggestions(librarySites);
  }

  const staticSites = [...staticEvacuationSiteSuggestions(municipality)];
  const librarySites = allRows.map((row) => row.site_name);
  return mergeSuggestions(staticSites, librarySites);
}
