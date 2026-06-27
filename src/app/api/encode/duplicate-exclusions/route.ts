import { NextResponse } from "next/server";
import { checkAccessCode } from "@/lib/access-codes";
import {
  duplicateExclusionsToCache,
  listDuplicatePairExclusions,
} from "@/lib/duplicate-exclusions";
import { isTursoConfigured } from "@/lib/env";

function unauthorized(message = "Access code session is required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ exclusions: [] });
  }

  const code = request.headers.get("x-encode-code")?.trim();
  const sessionId = request.headers.get("x-encode-session-id")?.trim();
  if (!code || !sessionId) {
    return unauthorized();
  }

  try {
    const auth = await checkAccessCode(code, sessionId);
    if (!auth.valid) {
      return unauthorized(auth.reason || "Invalid session.");
    }

    const exclusions = await listDuplicatePairExclusions();
    return NextResponse.json({
      exclusions: duplicateExclusionsToCache(exclusions),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load duplicate exclusions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
