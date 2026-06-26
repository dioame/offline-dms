import { NextResponse } from "next/server";
import { listEvacuationSiteSuggestions } from "@/lib/ec-library";
import { evacuationSiteSuggestions as staticEvacuationSiteSuggestions } from "@/lib/sarangani-locations";
import { isTursoConfigured } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city_municipality = searchParams.get("city_municipality")?.trim() ?? "";
  const barangay = searchParams.get("barangay")?.trim() ?? "";

  if (!city_municipality) {
    return NextResponse.json(
      { error: "city_municipality is required." },
      { status: 400 },
    );
  }

  try {
    const suggestions = isTursoConfigured()
      ? await listEvacuationSiteSuggestions(city_municipality, barangay || undefined)
      : [...staticEvacuationSiteSuggestions(city_municipality)];

    return NextResponse.json({ suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load evacuation sites.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
