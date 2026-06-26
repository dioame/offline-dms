import { NextResponse } from "next/server";
import {
  addEcLibrarySite,
  deleteEcLibrarySite,
  listEcLibrary,
} from "@/lib/ec-library";
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
      { error: "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN." },
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

  const { searchParams } = new URL(request.url);
  const city_municipality = searchParams.get("city_municipality") ?? undefined;
  const barangay = searchParams.get("barangay") ?? undefined;

  try {
    const sites = await listEcLibrary({ city_municipality, barangay });
    return NextResponse.json({ sites });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list evacuation sites.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: {
    password?: string;
    city_municipality?: string;
    barangay?: string;
    site_name?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const denied = checkAdmin(request, body);
  if (denied) return denied;

  try {
    const site = await addEcLibrarySite({
      city_municipality: body.city_municipality ?? "",
      barangay: body.barangay ?? "",
      site_name: body.site_name ?? "",
    });
    return NextResponse.json({ site });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to add evacuation site.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  let body: { password?: string; id?: number };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const denied = checkAdmin(request, body);
  if (denied) return denied;

  if (!body.id) {
    return NextResponse.json({ error: "Site id is required." }, { status: 400 });
  }

  try {
    await deleteEcLibrarySite(body.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete evacuation site.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
