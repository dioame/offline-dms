import { NextResponse } from "next/server";
import { isTursoConfigured, verifyAdminPassword } from "@/lib/env";
import { readBatchPdfJob } from "@/lib/batch-pdf/job-store";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getPassword(request: Request): string {
  return request.headers.get("x-admin-password")?.trim() || "";
}

function checkAdmin(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN." },
      { status: 503 },
    );
  }
  if (!verifyAdminPassword(getPassword(request))) {
    return unauthorized();
  }
  return null;
}

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { jobId } = await context.params;
  const job = await readBatchPdfJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Batch PDF job not found." }, { status: 404 });
  }
  if (job.status !== "complete") {
    return NextResponse.json({ error: "PDF is not ready yet." }, { status: 409 });
  }
  if (!job.pdfData?.length) {
    return NextResponse.json({ error: "PDF file missing." }, { status: 404 });
  }

  return new NextResponse(Buffer.from(job.pdfData), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${job.filename.replace(/"/g, "")}"`,
      "Cache-Control": "no-store",
    },
  });
}
