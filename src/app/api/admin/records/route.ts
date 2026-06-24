import { NextResponse } from "next/server";
import { listFacedRecordsTrashAdmin } from "@/lib/records-trash";
import { listFacedRecordsAdmin } from "@/lib/records-admin";
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

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("pageSize") ?? "25");
  const scope = searchParams.get("scope");

  try {
    const data =
      scope === "trash"
        ? await listFacedRecordsTrashAdmin({ search, page, pageSize })
        : await listFacedRecordsAdmin({ search, page, pageSize });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load records.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
