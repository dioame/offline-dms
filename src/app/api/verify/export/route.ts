import { NextResponse } from "next/server";
import { isTursoConfigured, verifyVerifyPassword } from "@/lib/env";
import { listFacedRecordsForExport } from "@/lib/verify-export";

function unauthorized() {
  return NextResponse.json({ error: "Invalid verify password." }, { status: 401 });
}

function getPassword(request: Request): string {
  return request.headers.get("x-verify-password")?.trim() || "";
}

function checkVerify(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }
  if (!verifyVerifyPassword(getPassword(request))) {
    return unauthorized();
  }
  return null;
}

export async function POST(request: Request) {
  const denied = checkVerify(request);
  if (denied) return denied;

  let body: { city_municipality?: string; barangay?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const records = await listFacedRecordsForExport({
      city_municipality: body.city_municipality ?? "",
      barangay: body.barangay ?? "",
    });
    return NextResponse.json({ count: records.length, records });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Export failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
