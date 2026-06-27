import fs from "node:fs";
import path from "node:path";
import {
  getAdminPassword,
  getTursoEnv,
  getVerifyPassword,
  isTursoConfigured,
} from "@/lib/env";
import { getTursoClient } from "@/lib/turso";

export type ReadinessCheck = {
  id: string;
  label: string;
  ready: boolean;
  message?: string;
};

function getLocalDatabasePath(url: string): string | null {
  if (!url.startsWith("file:")) return null;
  let filePath = url.slice("file:".length);
  if (filePath.startsWith("//")) {
    filePath = filePath.slice(2);
  }
  return path.normalize(filePath);
}

export async function getServerReadinessChecks(): Promise<ReadinessCheck[]> {
  const checks: ReadinessCheck[] = [];

  const configured = isTursoConfigured();
  checks.push({
    id: "database_configured",
    label: "Database URL configured",
    ready: configured,
    message: configured ? undefined : "Set TURSO_DATABASE_URL in config.js",
  });

  if (!configured) {
    checks.push(
      {
        id: "database_file",
        label: "Database file accessible",
        ready: false,
        message: "Skipped — database not configured",
      },
      {
        id: "database_connected",
        label: "Database connection",
        ready: false,
        message: "Skipped — database not configured",
      },
      {
        id: "database_schema",
        label: "Database schema ready",
        ready: false,
        message: "Skipped — database not configured",
      },
    );
  } else {
    const { url } = getTursoEnv();
    const localPath = getLocalDatabasePath(url);

    if (localPath) {
      const exists = fs.existsSync(localPath);
      checks.push({
        id: "database_file",
        label: "Database file accessible",
        ready: exists,
        message: exists ? undefined : `File not found: ${localPath}`,
      });
    } else {
      checks.push({
        id: "database_file",
        label: "Database file accessible",
        ready: true,
        message: "Remote database (no local file check)",
      });
    }

    try {
      const db = getTursoClient();
      await db.execute("SELECT 1");
      checks.push({
        id: "database_connected",
        label: "Database connection",
        ready: true,
      });
    } catch (error) {
      checks.push({
        id: "database_connected",
        label: "Database connection",
        ready: false,
        message: error instanceof Error ? error.message : "Connection failed",
      });
    }

    try {
      const db = getTursoClient();
      const migrations = await db.execute(
        "SELECT COUNT(*) AS count FROM _migrations",
      );
      const count = Number(migrations.rows[0]?.count ?? 0);
      checks.push({
        id: "database_schema",
        label: "Database schema ready",
        ready: count > 0,
        message:
          count > 0 ? undefined : "No migrations applied. Run npm run migrate",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Schema check failed";
      const missingTable = message.toLowerCase().includes("no such table");
      checks.push({
        id: "database_schema",
        label: "Database schema ready",
        ready: false,
        message: missingTable
          ? "Database schema not initialized. Run npm run migrate"
          : message,
      });
    }
  }

  const adminPassword = getAdminPassword();
  checks.push({
    id: "admin_password",
    label: "Admin password configured",
    ready: Boolean(adminPassword),
    message: adminPassword ? undefined : "Set ADMIN_PASSWORD in config.js",
  });

  const verifyPassword = getVerifyPassword();
  checks.push({
    id: "verify_password",
    label: "Verify password configured",
    ready: Boolean(verifyPassword),
    message: verifyPassword ? undefined : "Set VERIFY_PASSWORD in config.js",
  });

  return checks;
}

export function isServerReady(checks: ReadinessCheck[]): boolean {
  return checks.every((check) => check.ready);
}
