import { NextResponse } from "next/server";
import {
  getDailyEncodeStats,
  getEnumeratorSummaries,
  getRecordsAdminMetrics,
} from "@/lib/admin-stats";
import { isTursoConfigured } from "@/lib/env";

export async function GET(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      {
        error:
          "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.",
      },
      { status: 503 },
    );
  }

  try {
    const url = new URL(request.url);
    const municipality = url.searchParams.get("municipality")?.trim() || undefined;
    const filter = municipality ? { municipality } : {};

    const [data, records, dailyEncode] = await Promise.all([
      getEnumeratorSummaries(filter),
      getRecordsAdminMetrics(filter),
      getDailyEncodeStats(30, filter),
    ]);

    return NextResponse.json({
      ...data,
      records,
      daily_encode: dailyEncode,
      municipality: municipality ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load encoding summary.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
