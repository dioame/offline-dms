import { NextResponse } from "next/server";
import {
  addAccessCode,
  assignAccessCode,
  generateAccessCodes,
  listAccessCodes,
  reactivateAccessCode,
  rejectAccessCode,
} from "@/lib/access-codes";
import { isTursoConfigured, verifyAdminPassword } from "@/lib/env";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getPassword(request: Request, body?: { password?: string }): string {
  const header = request.headers.get("x-admin-password");
  return header?.trim() || body?.password?.trim() || "";
}

function checkAdmin(request: Request, body?: { password?: string }) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }
  if (!verifyAdminPassword(getPassword(request, body))) {
    return unauthorized();
  }
  return null;
}

export async function GET(request: Request) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  try {
    const codes = await listAccessCodes();
    return NextResponse.json({ codes });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list codes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: {
    password?: string;
    action?: "generate" | "add";
    count?: number;
    code?: string;
    enumerator_name?: string;
    enumerator_email?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const denied = checkAdmin(request, body);
  if (denied) return denied;

  try {
    if (body.action === "generate") {
      const count = Math.min(Math.max(body.count ?? 1, 1), 100);
      const codes = await generateAccessCodes(count);
      return NextResponse.json({ codes });
    }

    if (body.action === "add") {
      if (!body.code?.trim()) {
        return NextResponse.json({ error: "Code is required." }, { status: 400 });
      }
      const code = await addAccessCode(body.code, {
        enumerator_name: body.enumerator_name,
        enumerator_email: body.enumerator_email,
      });
      return NextResponse.json({ code });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "generate" or "add".' },
      { status: 400 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  let body: {
    password?: string;
    action?: "reject" | "reactivate" | "assign";
    code?: string;
    enumerator_name?: string;
    enumerator_email?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const denied = checkAdmin(request, body);
  if (denied) return denied;

  if (!body.code?.trim()) {
    return NextResponse.json({ error: "Code is required." }, { status: 400 });
  }

  try {
    if (body.action === "reject") {
      await rejectAccessCode(body.code);
      return NextResponse.json({ success: true });
    }

    if (body.action === "reactivate") {
      await reactivateAccessCode(body.code);
      return NextResponse.json({ success: true });
    }

    if (body.action === "assign") {
      await assignAccessCode(body.code, {
        enumerator_name: body.enumerator_name,
        enumerator_email: body.enumerator_email,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "reject", "reactivate", or "assign".' },
      { status: 400 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
