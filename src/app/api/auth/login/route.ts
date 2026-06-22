import { NextResponse } from "next/server";
import { getAccessCodeAssignee, redeemAccessCode } from "@/lib/access-codes";
import { isTursoConfigured } from "@/lib/env";

export async function POST(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Server database is not configured." },
      { status: 503 },
    );
  }

  let body: { code?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const code = body.code?.trim();
  const sessionId = body.sessionId?.trim();
  if (!code) {
    return NextResponse.json({ error: "Access code is required." }, { status: 400 });
  }
  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
  }

  try {
    const result = await redeemAccessCode(code, sessionId);
    if (!result.valid) {
      return NextResponse.json({ error: result.reason }, { status: 401 });
    }
    const assignee = await getAccessCodeAssignee(code);
    return NextResponse.json({
      success: true,
      code: code.trim().toUpperCase(),
      sessionId,
      enumerator_name: assignee?.enumerator_name ?? null,
      enumerator_email: assignee?.enumerator_email ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Login failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
