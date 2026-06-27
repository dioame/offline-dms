import { NextResponse } from "next/server";
import {
  batchPdfChunkCount,
  readBatchPdfJob,
  readBatchPdfPayload,
  sliceBatchPdfPayload,
} from "@/lib/batch-pdf/job-store";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim() ?? "";
  const chunkRaw = searchParams.get("chunk")?.trim() ?? "0";
  const chunkIndex = Number.parseInt(chunkRaw, 10);

  const job = await readBatchPdfJob(jobId);
  if (!job || job.token !== token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await readBatchPdfPayload(jobId);
  if (!payload?.heads?.length) {
    return NextResponse.json({ error: "Print payload not found." }, { status: 404 });
  }

  const totalChunks = batchPdfChunkCount(payload.heads.length);
  if (!Number.isFinite(chunkIndex) || chunkIndex < 0 || chunkIndex >= totalChunks) {
    return NextResponse.json({ error: "Invalid chunk index." }, { status: 400 });
  }

  const chunkPayload = sliceBatchPdfPayload(payload, chunkIndex);
  return NextResponse.json({
    payload: chunkPayload,
    chunkIndex,
    totalChunks,
  });
}
