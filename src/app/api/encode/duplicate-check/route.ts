import { NextResponse } from "next/server";
import { checkAccessCode } from "@/lib/access-codes";
import { isTursoConfigured } from "@/lib/env";
import { searchEncodedBeneficiary } from "@/lib/verify-search";

export async function POST(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ matches: [], source: "online", searchedAt: new Date().toISOString() });
  }

  let body: {
    code?: string;
    sessionId?: string;
    last_name?: string;
    first_name?: string;
    middle_name?: string;
    birthdate?: string;
    city_municipality?: string;
    barangay?: string;
    exclude_uuid?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const code = body.code?.trim();
  const sessionId = body.sessionId?.trim();
  if (!code || !sessionId) {
    return NextResponse.json({ error: "Access code session is required." }, { status: 401 });
  }

  try {
    const auth = await checkAccessCode(code, sessionId);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.reason || "Invalid session." }, { status: 401 });
    }

    const result = await searchEncodedBeneficiary({
      last_name: body.last_name ?? "",
      first_name: body.first_name ?? "",
      middle_name: body.middle_name,
      birthdate: body.birthdate,
      city_municipality: body.city_municipality,
      barangay: body.barangay,
    });

    const excludeUuid = body.exclude_uuid?.trim();
    const matches = excludeUuid
      ? result.matches.filter((match) => match.uuid !== excludeUuid)
      : result.matches;

    return NextResponse.json({ ...result, matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Duplicate check failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
