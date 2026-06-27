import { NextResponse } from "next/server";
import {
  getLocalDatabaseUrl,
  isRemoteTursoConfigured,
  isTursoConfigured,
} from "@/lib/env";
import { ensureTursoSchema, getTursoClient } from "@/lib/turso";

export async function GET() {
  if (!isTursoConfigured()) {
    return NextResponse.json({
      database: "not_configured",
      message: "Database is not configured in config.js",
    });
  }

  try {
    await ensureTursoSchema();
    const db = getTursoClient();
    await db.execute("SELECT 1");

    return NextResponse.json({
      ok: true,
      database: isRemoteTursoConfigured() ? "turso" : "sqlite",
      url: isRemoteTursoConfigured() ? undefined : getLocalDatabaseUrl(),
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
