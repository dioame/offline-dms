import { NextResponse } from "next/server";
import { checkAccessCode } from "@/lib/access-codes";
import { isTursoConfigured } from "@/lib/env";
import { getFacedRecordAdmin } from "@/lib/records-admin";

type RouteContext = { params: Promise<{ uuid: string }> };

function unauthorized(message = "Access code session is required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

function getEncoderSession(request: Request): { code: string; sessionId: string } | null {
  const code = request.headers.get("x-encode-code")?.trim();
  const sessionId = request.headers.get("x-encode-session-id")?.trim();
  if (!code || !sessionId) return null;
  return { code, sessionId };
}

export async function GET(request: Request, context: RouteContext) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ error: "Online records are not available." }, { status: 503 });
  }

  const session = getEncoderSession(request);
  if (!session) {
    return unauthorized();
  }

  const auth = await checkAccessCode(session.code, session.sessionId);
  if (!auth.valid) {
    return unauthorized(auth.reason || "Invalid session.");
  }

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
