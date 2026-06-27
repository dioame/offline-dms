import { NextResponse } from "next/server";
import { getServerReadinessChecks, isServerReady } from "@/lib/readiness-server";

export async function GET() {
  try {
    const checks = await getServerReadinessChecks();

    return NextResponse.json({
      ok: isServerReady(checks),
      checks,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Readiness check failed";

    return NextResponse.json({
      ok: false,
      checks: [
        {
          id: "readiness_error",
          label: "Server readiness check",
          ready: false,
          message,
        },
      ],
      error: message,
    });
  }
}
