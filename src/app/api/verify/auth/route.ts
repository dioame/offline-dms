import { NextResponse } from "next/server";
import { isTursoConfigured, verifyVerifyPassword } from "@/lib/env";

function unauthorized() {
  return NextResponse.json({ error: "Invalid verify password." }, { status: 401 });
}

function getPassword(request: Request): string {
  return request.headers.get("x-verify-password")?.trim() || "";
}

function checkVerify(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }
  if (!verifyVerifyPassword(getPassword(request))) {
    return unauthorized();
  }
  return null;
}

export async function GET(request: Request) {
  const denied = checkVerify(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true });
}
