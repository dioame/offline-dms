import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { FacedAnnexPrintPayload } from "@/lib/print/facedAnnexPrintWindow";

export const BATCH_PDF_CHUNK_SIZE = 40;

export type BatchPdfJobStatus = "queued" | "running" | "complete" | "failed";

export type BatchPdfJob = {
  id: string;
  status: BatchPdfJobStatus;
  logs: string[];
  filename: string;
  areaLabel: string;
  recordCount: number;
  token: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const ROOT = path.join(process.cwd(), ".tmp", "batch-pdf");

export function batchPdfJobDir(jobId: string): string {
  return path.join(ROOT, jobId);
}

function jobMetaPath(jobId: string): string {
  return path.join(batchPdfJobDir(jobId), "job.json");
}

export function batchPdfOutputPath(jobId: string): string {
  return path.join(batchPdfJobDir(jobId), "output.pdf");
}

function payloadPath(jobId: string): string {
  return path.join(batchPdfJobDir(jobId), "payload.json");
}

export async function ensureJobDir(jobId: string): Promise<string> {
  const dir = batchPdfJobDir(jobId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function createBatchPdfJob(input: {
  filename: string;
  areaLabel: string;
  recordCount: number;
}): Promise<BatchPdfJob> {
  const id = randomUUID();
  const token = randomUUID();
  const now = new Date().toISOString();
  const job: BatchPdfJob = {
    id,
    status: "queued",
    logs: [
      "> Background PDF worker queued.",
      `> Area: ${input.areaLabel}`,
      `> Records: ${input.recordCount}`,
    ],
    filename: input.filename,
    areaLabel: input.areaLabel,
    recordCount: input.recordCount,
    token,
    createdAt: now,
    updatedAt: now,
  };

  await ensureJobDir(id);
  await writeFile(jobMetaPath(id), JSON.stringify(job, null, 2), "utf8");
  return job;
}

export async function readBatchPdfJob(jobId: string): Promise<BatchPdfJob | null> {
  try {
    const raw = await readFile(jobMetaPath(jobId), "utf8");
    return JSON.parse(raw) as BatchPdfJob;
  } catch {
    return null;
  }
}

export async function writeBatchPdfJob(job: BatchPdfJob): Promise<void> {
  job.updatedAt = new Date().toISOString();
  await writeFile(jobMetaPath(job.id), JSON.stringify(job, null, 2), "utf8");
}

export async function appendBatchPdfJobLog(jobId: string, line: string): Promise<BatchPdfJob> {
  const job = await readBatchPdfJob(jobId);
  if (!job) {
    throw new Error("Batch PDF job not found.");
  }
  job.logs = [...job.logs, line];
  await writeBatchPdfJob(job);
  return job;
}

export async function patchBatchPdfJob(
  jobId: string,
  patch: Partial<Pick<BatchPdfJob, "status" | "error" | "logs">>,
): Promise<BatchPdfJob> {
  const job = await readBatchPdfJob(jobId);
  if (!job) {
    throw new Error("Batch PDF job not found.");
  }
  Object.assign(job, patch);
  await writeBatchPdfJob(job);
  return job;
}

export async function writeBatchPdfPayload(
  jobId: string,
  payload: FacedAnnexPrintPayload,
): Promise<void> {
  await ensureJobDir(jobId);
  await writeFile(payloadPath(jobId), JSON.stringify(payload), "utf8");
}

export async function readBatchPdfPayload(jobId: string): Promise<FacedAnnexPrintPayload | null> {
  try {
    const raw = await readFile(payloadPath(jobId), "utf8");
    return JSON.parse(raw) as FacedAnnexPrintPayload;
  } catch {
    return null;
  }
}

export function sliceBatchPdfPayload(
  payload: FacedAnnexPrintPayload,
  chunkIndex: number,
  chunkSize = BATCH_PDF_CHUNK_SIZE,
): FacedAnnexPrintPayload {
  const start = chunkIndex * chunkSize;
  const heads = payload.heads.slice(start, start + chunkSize);
  const membersByHead: Record<string, FacedAnnexPrintPayload["membersByHead"][string]> = {};

  for (const head of heads) {
    const key = head.serial_code.trim().toUpperCase();
    const members = payload.membersByHead[key] ?? payload.membersByHead[head.serial_code];
    if (members) {
      membersByHead[key] = members;
    }
  }

  return {
    ...payload,
    heads,
    membersByHead,
  };
}

export function batchPdfChunkCount(headCount: number, chunkSize = BATCH_PDF_CHUNK_SIZE): number {
  return Math.max(1, Math.ceil(headCount / chunkSize));
}
