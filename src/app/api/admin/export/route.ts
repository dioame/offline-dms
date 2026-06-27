import { NextResponse } from "next/server";
import { listFacedRecordsForAdminExport } from "@/lib/admin-export";
import { isTursoConfigured, verifyAdminPassword } from "@/lib/env";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getPassword(request: Request): string {
  return request.headers.get("x-admin-password")?.trim() || "";
}

function checkAdmin(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
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

  let body: { access_code?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const records = await listFacedRecordsForAdminExport({
      access_code: body.access_code,
    });
    return NextResponse.json({ count: records.length, records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
