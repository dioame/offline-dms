import { NextResponse } from "next/server";
import { checkAccessCode } from "@/lib/access-codes";
import { listEcLibrary } from "@/lib/ec-library";
import { ecLibraryRowToCacheEntry } from "@/lib/encode-offline-types";
import { isTursoConfigured } from "@/lib/env";

function unauthorized(message = "Access code session is required.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export async function GET(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
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

    const sites = await listEcLibrary();
    return NextResponse.json({
      sites: sites.map(ecLibraryRowToCacheEntry),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load evacuation sites.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
