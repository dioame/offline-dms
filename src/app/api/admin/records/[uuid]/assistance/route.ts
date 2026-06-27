import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import type { FamilyAssistanceRecordData } from "@/lib/family-assistance-types";
import { toTursoFamilyAssistanceRow, upsertFamilyAssistanceRecord, listFamilyAssistanceByFacedRecordUuid } from "@/lib/family-assistance";
import { getFacedRecordAdmin } from "@/lib/records-admin";
import { isTursoConfigured, verifyAdminPassword } from "@/lib/env";

type RouteContext = {
  params: Promise<{ uuid: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function getPassword(request: Request): string {
  return request.headers.get("x-admin-password")?.trim() || "";
}

function checkAdmin(request: Request) {
  if (!isTursoConfigured()) {
    return NextResponse.json(
      { error: "Database is not configured." },
      { status: 503 },
    );
  }
  if (!verifyAdminPassword(getPassword(request))) {
    return unauthorized();
  }
  return null;
}

function parseAssistanceBody(body: unknown): FamilyAssistanceRecordData | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Partial<FamilyAssistanceRecordData>;
  if (
    typeof record.date_provided !== "string" ||
    typeof record.receiving_member_name !== "string" ||
    typeof record.assistance_received !== "string" ||
    typeof record.unit !== "string" ||
    typeof record.quantity !== "string" ||
    typeof record.provider !== "string"
  ) {
    return null;
  }
  return {
    faced_record_uuid: "",
    access_code: typeof record.access_code === "string" ? record.access_code : "",
    date_provided: record.date_provided,
    receiving_member_name: record.receiving_member_name,
    assistance_received: record.assistance_received,
    unit: record.unit,
    quantity: record.quantity,
    cost_of_assistance:
      typeof record.cost_of_assistance === "string" ? record.cost_of_assistance : "",
    provider: record.provider,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const denied = checkAdmin(_request);
  if (denied) return denied;

  const { uuid } = await context.params;

  try {
    const facedRecord = await getFacedRecordAdmin(uuid);
    if (!facedRecord) {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }

    const assistance = await listFamilyAssistanceByFacedRecordUuid(uuid);
    return NextResponse.json({ assistance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load assistance records.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const denied = checkAdmin(request);
  if (denied) return denied;

  const { uuid } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const assistance = parseAssistanceBody(body);
  if (!assistance) {
    return NextResponse.json({ error: "Invalid assistance record payload." }, { status: 400 });
  }

  if (!assistance.date_provided.trim()) {
    return NextResponse.json({ error: "Date provided is required." }, { status: 400 });
  }
  if (!assistance.receiving_member_name.trim()) {
    return NextResponse.json({ error: "Receiving family member is required." }, { status: 400 });
  }
  if (!assistance.assistance_received.trim()) {
    return NextResponse.json({ error: "Assistance received is required." }, { status: 400 });
  }
  if (!assistance.provider.trim()) {
    return NextResponse.json({ error: "Provider is required." }, { status: 400 });
  }

  try {
    const facedRecord = await getFacedRecordAdmin(uuid);
    if (!facedRecord) {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const row = toTursoFamilyAssistanceRow({
      ...assistance,
      faced_record_uuid: uuid,
      access_code: assistance.access_code.trim() || facedRecord.access_code || "",
      uuid: randomUUID(),
      createdAt: now,
      updatedAt: now,
    });

    await upsertFamilyAssistanceRecord(row);
    return NextResponse.json({ assistance: row });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to save assistance record.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
