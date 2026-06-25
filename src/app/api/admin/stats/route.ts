import { NextResponse } from "next/server";
import { getEnumeratorSummaries, getRecordsAdminMetrics, getDailyEncodeStats } from "@/lib/admin-stats";
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

  try {
    const url = new URL(request.url);
    const municipality = url.searchParams.get("municipality")?.trim() || undefined;
    const filter = municipality ? { municipality } : {};

    const [data, records, dailyEncode] = await Promise.all([
      getEnumeratorSummaries(filter),
      getRecordsAdminMetrics(filter),
      getDailyEncodeStats(30, filter),
    ]);
    return NextResponse.json({ ...data, records, daily_encode: dailyEncode, municipality: municipality ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load stats.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
