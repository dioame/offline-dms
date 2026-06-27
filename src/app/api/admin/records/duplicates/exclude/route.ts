import { NextResponse } from "next/server";
import {
  buildNameKey,
  createDuplicatePairExclusions,
} from "@/lib/duplicate-exclusions";
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

  let body: {
    uuids?: string[];
    last_name?: string;
    first_name?: string;
    note?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const uuids = (body.uuids ?? []).map((uuid) => uuid.trim()).filter(Boolean);
  const lastName = body.last_name?.trim() ?? "";
  const firstName = body.first_name?.trim() ?? "";

  if (uuids.length < 2) {
    return NextResponse.json(
      { error: "At least two record UUIDs are required." },
      { status: 400 },
    );
  }

  if (!lastName || !firstName) {
    return NextResponse.json(
      { error: "First and last name are required for this duplicate group." },
      { status: 400 },
    );
  }

  try {
    const exclusions = await createDuplicatePairExclusions({
      uuids,
      nameKey: buildNameKey(lastName, firstName),
      note: body.note,
    });

    return NextResponse.json({
      success: true,
      pairCount: exclusions.length,
      exclusions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to verify not duplicates.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
