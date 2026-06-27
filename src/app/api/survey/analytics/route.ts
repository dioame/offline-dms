import { NextResponse } from "next/server";
import { getSurveyAnalytics } from "@/lib/survey-db";
import { isTursoConfigured, verifyAdminPassword } from "@/lib/env";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

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

  const password = request.headers.get("x-admin-password")?.trim() || "";
  if (!verifyAdminPassword(password)) {
    return unauthorized();
  }

  try {
    const analytics = await getSurveyAnalytics();
    return NextResponse.json({ analytics });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load survey analytics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
