import { NextResponse } from "next/server";
import {
  buildReportsBundle,
  listDashboardMunicipalities,
  loadDashboardRecords,
} from "@/lib/dashboard-aggregation";
import { isTursoConfigured } from "@/lib/env";

export async function GET(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env" },
      { status: 503 },
    );
  }

  const url = new URL(request.url);
  const cityMun = url.searchParams.get("city_mun")?.trim() ?? "";

  try {
    const [records, municipalities] = await Promise.all([
      loadDashboardRecords(cityMun || undefined),
      listDashboardMunicipalities(),
    ]);
    const bundle = buildReportsBundle(records, cityMun);
    bundle.municipalities = municipalities;
    return NextResponse.json(bundle);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load dashboard data." },
      { status: 500 },
    );
  }
}
