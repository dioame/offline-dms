import type { VerifyCacheEntry, VerifySearchInput } from "./verify-match";
import { filterVerifyEntries } from "./verify-match";
import type { VerifyCacheMeta } from "./db";
import { db } from "./db";

const CHUNK_SIZE = 500;

export async function getVerifyCacheMeta(): Promise<VerifyCacheMeta | undefined> {
  return db.verify_meta.get("current");
}

export async function getVerifyCacheCount(): Promise<number> {
  return db.verify_cache.count();
}

export async function getAllVerifyCacheEntries(): Promise<VerifyCacheEntry[]> {
  return db.verify_cache.toArray();
}

export async function clearVerifyCache(): Promise<void> {
  await db.verify_cache.clear();
  await db.verify_meta.delete("current");
}

export async function saveVerifyCacheChunk(
  records: VerifyCacheEntry[],
  meta: VerifyCacheMeta,
): Promise<void> {
  await db.verify_cache.bulkPut(records);
  await db.verify_meta.put(meta);
}

export type VerifyDownloadProgress = {
  downloaded: number;
  total: number;
};

export type VerifyDownloadResult = {
  totalRecords: number;
  syncedAt: string;
};

export async function downloadVerifyCache(
  fetchChunk: (offset: number, limit: number) => Promise<Response>,
  onProgress?: (progress: VerifyDownloadProgress) => void,
): Promise<VerifyDownloadResult> {
  await clearVerifyCache();

  let offset = 0;
  let total = 0;
  let downloaded = 0;

  while (true) {
    const res = await fetchChunk(offset, CHUNK_SIZE);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to download verify data.");
    }

    total = Number(data.total ?? 0);
    const records = (data.records ?? []) as VerifyCacheEntry[];

    if (records.length > 0) {
      await db.verify_cache.bulkPut(records);
      downloaded += records.length;
      offset += records.length;
      onProgress?.({ downloaded, total });
    }

    if (!data.hasMore || records.length === 0) {
      break;
    }
  }

  const syncedAt = new Date().toISOString();
  await db.verify_meta.put({
    id: "current",
    syncedAt,
    totalRecords: downloaded,
  });

  return { totalRecords: downloaded, syncedAt };
}

export function searchCachedBeneficiary(entries: VerifyCacheEntry[], input: VerifySearchInput) {
  return {
    matches: filterVerifyEntries(entries, input),
    searchedAt: new Date().toISOString(),
    source: "offline" as const,
  };
}
