import { NextResponse } from "next/server";
import {
  deleteFacedRecordAdmin,
  getFacedRecordAdmin,
  isFullFacedRecordPayload,
  replaceFacedRecordAdmin,
  updateFacedRecordAdmin,
  type UpdateFacedRecordAdminInput,
} from "@/lib/records-admin";
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
      { error: "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN." },
      { status: 503 },
    );
  }
  if (!verifyAdminPassword(getPassword(request))) {
    return unauthorized();
  }
  return null;
}

export async function GET(_request: Request, context: RouteContext) {
  const denied = checkAdmin(_request);
  if (denied) return denied;

  const { uuid } = await context.params;

  try {
    const record = await getFacedRecordAdmin(uuid);
    if (!record) {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }
    return NextResponse.json({ record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load record.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { uuid } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const record = isFullFacedRecordPayload(body)
      ? await replaceFacedRecordAdmin(uuid, body)
      : await updateFacedRecordAdmin(uuid, body as UpdateFacedRecordAdminInput);
    return NextResponse.json({ record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update record.";
    const status = message === "Record not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { uuid } = await context.params;

  try {
    await deleteFacedRecordAdmin(uuid);
    return NextResponse.json({ success: true, softDeleted: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to soft-delete record.";
    const status = message === "Record not found." ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
