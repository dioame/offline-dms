import { NextResponse } from "next/server";
import { insertSurveyResponse, listSurveyResponses } from "@/lib/survey-db";
import { validateSurveyPayload } from "@/lib/survey-types";
import { isTursoConfigured, verifyAdminPassword } from "@/lib/env";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getAdminPassword(request: Request): string {
  return request.headers.get("x-admin-password")?.trim() || "";
}

function checkAdmin(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      {
        error:
          "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.",
      },
      { status: 503 },
    );
  }
  if (!verifyAdminPassword(getAdminPassword(request))) {
    return unauthorized();
  }
  return null;
}

export async function POST(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      {
        error:
          "Survey is unavailable. Database is not configured on the server.",
      },
      { status: 503 },
    );
  }

  let body: { payload?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const payload = validateSurveyPayload(body.payload);
    const response = await insertSurveyResponse(payload);
    return NextResponse.json({ success: true, id: response.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save survey.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? "500");

  try {
    const responses = await listSurveyResponses(limit);
    return NextResponse.json({ responses });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to load survey responses.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
