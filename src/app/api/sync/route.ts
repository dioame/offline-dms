import { NextResponse } from "next/server";
import { getSyncApiSecret, isTursoConfigured } from "@/lib/env";
import type { FacedRecord } from "@/lib/faced-types";
import type { FamilyAssistanceRecord } from "@/lib/family-assistance-types";
import {
  toTursoFamilyAssistanceRow,
  upsertFamilyAssistanceRecord,
} from "@/lib/family-assistance";
import { ensureTursoSchema, upsertFacedRecord } from "@/lib/turso";
import { normalizeRecordAccessCode } from "@/lib/backfill-access-codes";
import { ensureFacedSerialNumber } from "@/lib/faced-serial";

type SyncPayload = {
  records: (Omit<FacedRecord, "createdAt" | "updatedAt"> & {
    createdAt: string;
    updatedAt: string;
  })[];
  assistance_records?: (Omit<FamilyAssistanceRecord, "createdAt" | "updatedAt" | "id"> & {
    createdAt: string;
    updatedAt: string;
  })[];
};

export async function POST(request: Request) {
  const secret = getSyncApiSecret();
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isTursoConfigured()) {
    return NextResponse.json(
      {
        error:
          "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env",
      },
      { status: 503 },
    );
  }

  let body: SyncPayload;
  try {
    body = (await request.json()) as SyncPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.records)) {
    return NextResponse.json(
      { error: "records array is required" },
      { status: 400 },
    );
  }

  const assistanceRecords = body.assistance_records ?? [];
  if (body.records.length === 0 && assistanceRecords.length === 0) {
    return NextResponse.json(
      { error: "records or assistance_records array is required" },
      { status: 400 },
    );
  }

  try {
    await ensureTursoSchema();
  } catch (err) {
    return NextResponse.json(
      {
        error: `Database setup failed: ${
          err instanceof Error ? err.message : "unknown error"
        }. Run npm run migrate.`,
      },
      { status: 503 },
    );
  }

  const synced: string[] = [];
  const failed: { uuid: string; error: string }[] = [];
  const syncedAssistance: string[] = [];
  const failedAssistance: { uuid: string; error: string }[] = [];

  for (const record of body.records) {
    try {
      if (!record.uuid) {
        throw new Error("Record missing uuid");
      }

      const { id: _id, sync_status: _sync, ...data } = record;
      const payload = {
        ...data,
        serial_number: ensureFacedSerialNumber(data.serial_number, record.uuid),
      };

      await upsertFacedRecord({
        uuid: record.uuid,
        access_code: normalizeRecordAccessCode(record.access_code),
        enumerator_name: record.enumerator_name ?? "",
        barangay: record.barangay || "",
        city_municipality: record.city_municipality || "",
        province: record.province || "",
        date_registered: record.date_registered || "",
        payload: JSON.stringify(payload),
        created_at: record.createdAt,
        updated_at: record.updatedAt,
      });

      synced.push(record.uuid);
    } catch (err) {
      failed.push({
        uuid: record.uuid,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  for (const record of assistanceRecords) {
    try {
      if (!record.uuid) {
        throw new Error("Assistance record missing uuid");
      }
      if (!record.faced_record_uuid) {
        throw new Error("Assistance record missing faced_record_uuid");
      }

      await upsertFamilyAssistanceRecord(
        toTursoFamilyAssistanceRow({
          ...record,
          access_code: normalizeRecordAccessCode(record.access_code),
        }),
      );

      syncedAssistance.push(record.uuid);
    } catch (err) {
      failedAssistance.push({
        uuid: record.uuid,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    synced,
    failed,
    synced_assistance: syncedAssistance,
    failed_assistance: failedAssistance,
  });
}
