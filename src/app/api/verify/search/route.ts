import { NextResponse } from "next/server";
import { isTursoConfigured, verifyVerifyPassword } from "@/lib/env";
import { searchEncodedBeneficiary } from "@/lib/verify-search";

function unauthorized() {
  return NextResponse.json({ error: "Invalid verify password." }, { status: 401 });
}

function getPassword(request: Request): string {
  return request.headers.get("x-verify-password")?.trim() || "";
}

function checkVerify(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN." },
      { status: 503 },
    );
  }
  if (!verifyVerifyPassword(getPassword(request))) {
    return unauthorized();
  }
  return null;
}

export async function POST(request: Request) {
  const denied = checkVerify(request);
  if (denied) return denied;

  let body: {
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    birthdate?: string;
    city_municipality?: string;
    barangay?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  try {
    const result = await searchEncodedBeneficiary({
      last_name: body.last_name ?? "",
      first_name: body.first_name ?? "",
      middle_name: body.middle_name,
      birthdate: body.birthdate,
      city_municipality: body.city_municipality,
      barangay: body.barangay,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
