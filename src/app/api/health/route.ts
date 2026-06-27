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
      ok: false,
<<<<<<< HEAD
      turso: "not_configured",
      message: "Database is not configured",
=======
      database: "not_configured",
      message: "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN, or use local SQLite.",
>>>>>>> dadc66ef36a982c53e4d97b232e6c9dd731c6063
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
