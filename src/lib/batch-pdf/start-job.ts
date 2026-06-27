import { listFacedRecordsForAdminExport } from "@/lib/admin-export";
import { buildFacedBatchPdfFilename } from "@/lib/batch-pdf/filename";
import { buildOfflineDmsPrintBundles } from "@/lib/print/offlineDmsFacedPrint";
import { serializeMembersByHead } from "@/lib/print/facedAnnexPrintWindow";
import {
  createBatchPdfJob,
  writeBatchPdfPayload,
} from "@/lib/batch-pdf/job-store";
import { scheduleBatchPdfWorker } from "@/lib/batch-pdf/schedule-worker";

export type StartBatchPdfInput = {
  city_municipality: string;
  barangay?: string;
};

export async function startBatchPdfJob(input: StartBatchPdfInput, baseUrl: string) {
  const city_municipality = input.city_municipality.trim();
  const barangay = input.barangay?.trim() ?? "";

  if (!city_municipality) {
    throw new Error("City / municipality is required.");
  }

  const records = await listFacedRecordsForAdminExport({
    city_municipality,
    barangay: barangay || undefined,
  });

  if (records.length === 0) {
    throw new Error("No synced records found for the selected area.");
  }

  const areaLabel = barangay
    ? `${barangay}, ${city_municipality}`
    : `${city_municipality} (all barangays)`;

  const filename = buildFacedBatchPdfFilename(city_municipality, barangay);
  const { heads, membersByHead } = buildOfflineDmsPrintBundles(records);

  const dateLabel = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const title = `FACED Form — ${areaLabel} — ${heads.length} heads — ${dateLabel}`;

  const job = await createBatchPdfJob({
    filename,
    areaLabel,
    recordCount: records.length,
  });

  await writeBatchPdfPayload(job.id, {
    heads,
    membersByHead: serializeMembersByHead(membersByHead),
    title,
    pdfFilename: filename,
  });

  scheduleBatchPdfWorker(job.id, baseUrl);

  return {
    jobId: job.id,
    filename: job.filename,
    recordCount: job.recordCount,
    areaLabel: job.areaLabel,
    logs: job.logs,
    status: job.status,
  };
}
