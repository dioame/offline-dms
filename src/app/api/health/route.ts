import { NextResponse } from "next/server";
import { isTursoConfigured } from "@/lib/env";
import { ensureTursoSchema, getTursoClient } from "@/lib/turso";

export async function GET() {
  if (!isTursoConfigured()) {
    return NextResponse.json({
      ok: false,
      turso: "not_configured",
      message: "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env",
    });
  }

  try {
    await ensureTursoSchema();
    const db = getTursoClient();
    await db.execute("SELECT 1");

    return NextResponse.json({
      ok: true,
      turso: "connected",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        turso: "error",
        message: err instanceof Error ? err.message : "Connection failed",
      },
      { status: 503 },
    );
  }
}
