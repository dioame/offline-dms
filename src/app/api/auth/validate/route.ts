import { NextResponse } from "next/server";
import { checkAccessCode, getAccessCodeAssignee } from "@/lib/access-codes";
import { isTursoConfigured } from "@/lib/env";

export async function POST(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json({ valid: true });
  }

  let body: { code?: string; sessionId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const code = body.code?.trim();
  const sessionId = body.sessionId?.trim();
  if (!code || !sessionId) {
    return NextResponse.json({ valid: false, reason: "Session is invalid." });
  }

  try {
    const result = await checkAccessCode(code, sessionId);
    const assignee = result.valid ? await getAccessCodeAssignee(code) : null;
    return NextResponse.json({
      valid: result.valid,
      reason: result.reason,
      enumerator_name: assignee?.enumerator_name ?? null,
      enumerator_email: assignee?.enumerator_email ?? null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
