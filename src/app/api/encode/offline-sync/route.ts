import { NextResponse } from "next/server";
import { checkAccessCode } from "@/lib/access-codes";
import { isTursoConfigured } from "@/lib/env";
import { listVerifyCacheChunk } from "@/lib/verify-sync-server";

function unauthorized(message = "Access code session is required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function getEncoderSession(request: Request): { code: string; sessionId: string } | null {
  const code = request.headers.get("x-encode-code")?.trim();
  const sessionId = request.headers.get("x-encode-session-id")?.trim();
  if (!code || !sessionId) return null;
  return { code, sessionId };
}

async function validateEncoderSession(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN." },
      { status: 503 },
    );
  }

  const session = getEncoderSession(request);
  if (!session) {
    return unauthorized();
  }

  const auth = await checkAccessCode(session.code, session.sessionId);
  if (!auth.valid) {
    return unauthorized(auth.reason || "Invalid session.");
  }

  return null;
}

export async function GET(request: Request) {
  const denied = await validateEncoderSession(request);
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
