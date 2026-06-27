import { NextResponse } from "next/server";
import { isTursoConfigured, verifyAdminPassword } from "@/lib/env";
import { startBatchPdfJob } from "@/lib/batch-pdf/start-job";

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

export async function POST(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  let body: { city_municipality?: string; barangay?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const baseUrl =
      process.env.BATCH_PDF_BASE_URL?.trim() || new URL(request.url).origin;
    const result = await startBatchPdfJob(
      {
        city_municipality: body.city_municipality ?? "",
        barangay: body.barangay,
      },
      baseUrl,
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start batch PDF job.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
