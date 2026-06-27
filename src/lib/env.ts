<<<<<<< HEAD
import appConfig from "../../config.js";

const DATABASE_URL = appConfig.TURSO_DATABASE_URL;
const ADMIN_PASSWORD = appConfig.ADMIN_PASSWORD;
const VERIFY_PASSWORD = appConfig.VERIFY_PASSWORD;

function isLocalDatabaseUrl(url: string): boolean {
  return url.startsWith("file:");
}

export function isTursoConfigured(): boolean {
  if (!DATABASE_URL) return false;
  if (isLocalDatabaseUrl(DATABASE_URL)) return true;
  return false;
}
=======
export function isRemoteTursoConfigured(): boolean {
  return Boolean(
    process.env.TURSO_DATABASE_URL?.trim() &&
      process.env.TURSO_AUTH_TOKEN?.trim(),
  );
}

/** True when a server database is available (remote Turso or local SQLite). */
export function isTursoConfigured(): boolean {
  return isRemoteTursoConfigured() || isLocalSqliteConfigured();
}

export function isLocalSqliteConfigured(): boolean {
  return !isRemoteTursoConfigured();
}

export function getSqliteDatabasePath(): string {
  return process.env.SQLITE_DATABASE_PATH?.trim() || "face_db.db";
}

export function getLocalDatabaseUrl(): string {
  return `file:${getSqliteDatabasePath()}`;
}

export function getTursoEnv(): { url: string; authToken: string } {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
>>>>>>> dadc66ef36a982c53e4d97b232e6c9dd731c6063

export function getTursoEnv(): { url: string; authToken?: string } {
  if (!DATABASE_URL) {
    throw new Error("Database URL is not configured.");
  }

  return { url: DATABASE_URL };
}

export function getDatabaseClientConfig(): { url: string; authToken?: string } {
  if (isRemoteTursoConfigured()) {
    return getTursoEnv();
  }
  return { url: getLocalDatabaseUrl() };
}

export function getSyncApiSecret(): string | undefined {
  return undefined;
}

export function getAdminPassword(): string | undefined {
  return ADMIN_PASSWORD;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) {
    return false;
  }
  return password === expected;
}

export function getVerifyPassword(): string {
  return VERIFY_PASSWORD;
}

export function verifyVerifyPassword(password: string): boolean {
  return password === getVerifyPassword();
}
