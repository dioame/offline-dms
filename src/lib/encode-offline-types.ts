import type { EcLibraryRow } from "./ec-library";

export type EcLibraryCacheEntry = {
  id: number;
  city_municipality: string;
  barangay: string;
  site_name: string;
};

export type EncodeOfflineMeta = {
  id: "current";
  syncedAt: string;
  totalFamilies: number;
  totalEcSites: number;
};

export function ecLibraryRowToCacheEntry(row: EcLibraryRow): EcLibraryCacheEntry {
  return {
    id: row.id,
    city_municipality: row.city_municipality,
    barangay: row.barangay,
    site_name: row.site_name,
  };
}
