import { clearVerifyCache, downloadVerifyCache } from "./verify-cache";
import {
  clearDuplicateExclusionsCache,
  saveDuplicateExclusionsCache,
} from "./duplicate-exclusions-cache";
import {
  clearEcLibraryCache,
  saveEcLibraryCache,
  saveEncodeOfflineMeta,
} from "./ec-library-cache";
import type { EcLibraryCacheEntry } from "./encode-offline-types";

export type EncodeOfflineDownloadProgress = {
  phase: "families" | "ec-library" | "duplicate-exclusions" | "finishing";
  label: string;
  downloaded: number;
  total: number;
  percent: number;
};

const FAMILY_WEIGHT = 0.9;

function familyPercent(downloaded: number, total: number): number {
  if (total <= 0) return FAMILY_WEIGHT * 100;
  return Math.min(FAMILY_WEIGHT * 100, (downloaded / total) * FAMILY_WEIGHT * 100);
}

export type EncodeOfflineDownloadResult = {
  totalFamilies: number;
  totalEcSites: number;
  totalDuplicateExclusions: number;
  syncedAt: string;
};

export async function downloadEncodeOfflineBundle(
  fetchFamiliesChunk: (offset: number, limit: number) => Promise<Response>,
  fetchEcLibrary: () => Promise<Response>,
  fetchDuplicateExclusions: () => Promise<Response>,
  onProgress?: (progress: EncodeOfflineDownloadProgress) => void,
): Promise<EncodeOfflineDownloadResult> {
  onProgress?.({
    phase: "families",
    label: "Downloading family records",
    downloaded: 0,
    total: 0,
    percent: 0,
  });

  const familyResult = await downloadVerifyCache(fetchFamiliesChunk, (progress) => {
    onProgress?.({
      phase: "families",
      label: "Downloading family records",
      downloaded: progress.downloaded,
      total: progress.total,
      percent: familyPercent(progress.downloaded, progress.total),
    });
  });

  onProgress?.({
    phase: "ec-library",
    label: "Downloading evacuation center library",
    downloaded: 0,
    total: 0,
    percent: FAMILY_WEIGHT * 100,
  });

  await clearEcLibraryCache();

  const ecRes = await fetchEcLibrary();
  const ecData = (await ecRes.json()) as { sites?: EcLibraryCacheEntry[]; error?: string };
  if (!ecRes.ok) {
    throw new Error(ecData.error || "Failed to download evacuation center library.");
  }

  const sites = (ecData.sites ?? []).map((site) => ({
    id: Number(site.id),
    city_municipality: String(site.city_municipality),
    barangay: String(site.barangay),
    site_name: String(site.site_name),
  }));

  if (sites.length > 0) {
    await saveEcLibraryCache(sites);
  }

  onProgress?.({
    phase: "duplicate-exclusions",
    label: "Downloading duplicate exclusions",
    downloaded: 0,
    total: 0,
    percent: 92,
  });

  await clearDuplicateExclusionsCache();

  const exclusionsRes = await fetchDuplicateExclusions();
  const exclusionsData = (await exclusionsRes.json()) as {
    exclusions?: import("./duplicate-exclusion-types").DuplicateExclusionCacheEntry[];
    error?: string;
  };
  if (!exclusionsRes.ok) {
    throw new Error(exclusionsData.error || "Failed to download duplicate exclusions.");
  }

  const exclusions = exclusionsData.exclusions ?? [];
  if (exclusions.length > 0) {
    await saveDuplicateExclusionsCache(exclusions);
  }

  onProgress?.({
    phase: "finishing",
    label: "Saving offline copy",
    downloaded: exclusions.length,
    total: exclusions.length,
    percent: 98,
  });

  const syncedAt = new Date().toISOString();
  await saveEncodeOfflineMeta({
    id: "current",
    syncedAt,
    totalFamilies: familyResult.totalRecords,
    totalEcSites: sites.length,
  });

  onProgress?.({
    phase: "finishing",
    label: "Offline copy ready",
    downloaded: familyResult.totalRecords + sites.length + exclusions.length,
    total: familyResult.totalRecords + sites.length + exclusions.length,
    percent: 100,
  });

  return {
    totalFamilies: familyResult.totalRecords,
    totalEcSites: sites.length,
    totalDuplicateExclusions: exclusions.length,
    syncedAt,
  };
}

export async function clearEncodeOfflineBundle(): Promise<void> {
  await clearVerifyCache();
  await clearEcLibraryCache();
  await clearDuplicateExclusionsCache();
  await saveEncodeOfflineMeta({
    id: "current",
    syncedAt: "",
    totalFamilies: 0,
    totalEcSites: 0,
  });
}
