import { NextResponse } from "next/server";
import { listDuplicateGroups } from "@/lib/records-admin";
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

export async function GET(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  try {
    const groups = await listDuplicateGroups();
    const totalDuplicates = groups.reduce((sum, group) => sum + group.count, 0);
    return NextResponse.json({
      groups,
      groupCount: groups.length,
      totalDuplicates,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load duplicates.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
