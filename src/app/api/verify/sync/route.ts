import { NextResponse } from "next/server";
import { isTursoConfigured, verifyVerifyPassword } from "@/lib/env";
import { listVerifyCacheChunk } from "@/lib/verify-sync-server";

function unauthorized() {
  return NextResponse.json({ error: "Invalid verify password." }, { status: 401 });
}

function getPassword(request: Request): string {
  return request.headers.get("x-verify-password")?.trim() || "";
}

function checkVerify(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN." },
      { status: 503 },
    );
  }
  if (!verifyVerifyPassword(getPassword(request))) {
    return unauthorized();
  }
  return null;
}

export async function GET(request: Request) {
  const denied = checkVerify(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get("offset") ?? "0");
  const limit = Number(searchParams.get("limit") ?? "500");

  try {
    const chunk = await listVerifyCacheChunk(offset, limit);
    return NextResponse.json(chunk);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
