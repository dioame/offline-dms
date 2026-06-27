import { NextResponse } from "next/server";
import { restoreFacedRecordAdmin } from "@/lib/records-admin";
import { isTursoConfigured, verifyAdminPassword } from "@/lib/env";

type RouteContext = {
  params: Promise<{ uuid: string }>;
};

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

export async function POST(_request: Request, context: RouteContext) {
  const denied = checkAdmin(_request);
  if (denied) return denied;

  const { uuid } = await context.params;

  try {
    await restoreFacedRecordAdmin(uuid);
    return NextResponse.json({ success: true, restored: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to restore record.";
    const status =
      message === "Record not found." || message === "Record is not in trash." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
