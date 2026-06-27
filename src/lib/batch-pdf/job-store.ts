import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { ensureTursoSchema, getTursoClient } from "@/lib/turso";
import type { FacedAnnexPrintPayload } from "@/lib/print/facedAnnexPrintWindow";
import { batchPdfJobTempDir } from "@/lib/batch-pdf/temp-dir";

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
  payload: FacedAnnexPrintPayload | null;
  pdfData: Uint8Array | null;
  chunkIndex: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

type BatchPdfJobRow = Record<string, unknown>;

function rowToJob(row: BatchPdfJobRow): BatchPdfJob {
  let logs: string[] = [];
  try {
    logs = JSON.parse(String(row.logs ?? "[]")) as string[];
  } catch {
    logs = [];
  }

  let payload: FacedAnnexPrintPayload | null = null;
  if (row.payload) {
    try {
      payload = JSON.parse(String(row.payload)) as FacedAnnexPrintPayload;
    } catch {
      payload = null;
    }
  }

  const pdfRaw = row.pdf_data;
  let pdfData: Uint8Array | null = null;
  if (pdfRaw instanceof Uint8Array) {
    pdfData = pdfRaw;
  } else if (pdfRaw instanceof ArrayBuffer) {
    pdfData = new Uint8Array(pdfRaw);
  } else if (Buffer.isBuffer(pdfRaw)) {
    pdfData = new Uint8Array(pdfRaw);
  }

  return {
    id: String(row.id),
    status: String(row.status) as BatchPdfJobStatus,
    logs,
    filename: String(row.filename),
    areaLabel: String(row.area_label),
    recordCount: Number(row.record_count ?? 0),
    token: String(row.token),
    payload,
    pdfData,
    chunkIndex: Number(row.chunk_index ?? 0),
    error: row.error ? String(row.error) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function batchPdfChunkCount(headCount: number, chunkSize = BATCH_PDF_CHUNK_SIZE): number {
  return Math.max(1, Math.ceil(headCount / chunkSize));
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

  return { ...payload, heads, membersByHead };
}

export async function createBatchPdfJob(input: {
  filename: string;
  areaLabel: string;
  recordCount: number;
}): Promise<BatchPdfJob> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const id = crypto.randomUUID();
  const token = crypto.randomUUID();
  const now = new Date().toISOString();
  const logs = [
    "> Background PDF worker queued.",
    `> Area: ${input.areaLabel}`,
    `> Records: ${input.recordCount}`,
  ];

  await db.execute({
    sql: `
      INSERT INTO batch_pdf_jobs (
        id, status, logs, filename, area_label, record_count, token,
        payload, pdf_data, chunk_index, error, created_at, updated_at
      ) VALUES (?, 'queued', ?, ?, ?, ?, ?, NULL, NULL, 0, NULL, ?, ?)
    `,
    args: [
      id,
      JSON.stringify(logs),
      input.filename,
      input.areaLabel,
      input.recordCount,
      token,
      now,
      now,
    ],
  });

  return {
    id,
    status: "queued",
    logs,
    filename: input.filename,
    areaLabel: input.areaLabel,
    recordCount: input.recordCount,
    token,
    payload: null,
    pdfData: null,
    chunkIndex: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function readBatchPdfJob(jobId: string): Promise<BatchPdfJob | null> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const result = await db.execute({
    sql: "SELECT * FROM batch_pdf_jobs WHERE id = ?",
    args: [jobId],
  });
  if (!result.rows.length) return null;
  return rowToJob(result.rows[0] as BatchPdfJobRow);
}

async function persistJob(job: BatchPdfJob): Promise<void> {
  await ensureTursoSchema();
  const db = getTursoClient();
  job.updatedAt = new Date().toISOString();

  await db.execute({
    sql: `
      UPDATE batch_pdf_jobs SET
        status = ?,
        logs = ?,
        payload = ?,
        pdf_data = ?,
        chunk_index = ?,
        error = ?,
        updated_at = ?
      WHERE id = ?
    `,
    args: [
      job.status,
      JSON.stringify(job.logs),
      job.payload ? JSON.stringify(job.payload) : null,
      job.pdfData ?? null,
      job.chunkIndex,
      job.error ?? null,
      job.updatedAt,
      job.id,
    ],
  });
}

export async function writeBatchPdfPayload(
  jobId: string,
  payload: FacedAnnexPrintPayload,
): Promise<void> {
  const job = await readBatchPdfJob(jobId);
  if (!job) throw new Error("Batch PDF job not found.");
  job.payload = payload;
  await persistJob(job);
}

export async function appendBatchPdfJobLog(jobId: string, line: string): Promise<BatchPdfJob> {
  const job = await readBatchPdfJob(jobId);
  if (!job) throw new Error("Batch PDF job not found.");
  job.logs = [...job.logs, line];
  await persistJob(job);
  return job;
}

export async function saveBatchPdfJob(job: BatchPdfJob): Promise<void> {
  await persistJob(job);
}

export function batchPdfOutputPath(jobId: string): string {
  return path.join(batchPdfJobTempDir(jobId), "output.pdf");
}

export async function ensureBatchPdfTempDir(jobId: string): Promise<string> {
  const dir = batchPdfJobTempDir(jobId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function mergePdfBytes(
  existing: Uint8Array | null,
  chunkBytes: Uint8Array,
): Promise<Uint8Array> {
  if (!existing?.length) return chunkBytes;

  const merged = await PDFDocument.create();
  for (const bytes of [existing, chunkBytes]) {
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    for (const page of pages) {
      merged.addPage(page);
    }
  }
  return merged.save();
}

export async function writeTempFile(jobId: string, name: string, bytes: Uint8Array): Promise<string> {
  const dir = await ensureBatchPdfTempDir(jobId);
  const filePath = path.join(dir, name);
  await writeFile(filePath, bytes);
  return filePath;
}

export async function readTempFile(jobId: string, name: string): Promise<Uint8Array | null> {
  try {
    const filePath = path.join(batchPdfJobTempDir(jobId), name);
    const bytes = await readFile(filePath);
    return new Uint8Array(bytes);
  } catch {
    return null;
  }
}
