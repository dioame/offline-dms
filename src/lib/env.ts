import appConfig from "../../config.js";

const DATABASE_URL = appConfig.TURSO_DATABASE_URL;
const ADMIN_PASSWORD = appConfig.ADMIN_PASSWORD;
const VERIFY_PASSWORD = appConfig.VERIFY_PASSWORD;

function isLocalDatabaseUrl(url: string): boolean {
  return url.startsWith("file:");
}

export function isRemoteTursoConfigured(): boolean {
  if (!DATABASE_URL?.trim()) return false;
  return !isLocalDatabaseUrl(DATABASE_URL);
}

export function isLocalSqliteConfigured(): boolean {
  if (!DATABASE_URL?.trim()) return false;
  return isLocalDatabaseUrl(DATABASE_URL);
}

export function isTursoConfigured(): boolean {
  return Boolean(DATABASE_URL?.trim());
}

export function getSqliteDatabasePath(): string {
  if (isLocalDatabaseUrl(DATABASE_URL)) {
    let filePath = DATABASE_URL.slice("file:".length);
    if (filePath.startsWith("//")) {
      filePath = filePath.slice(2);
    }
    return filePath;
  }
  return process.env.SQLITE_DATABASE_PATH?.trim() || "face_db.db";
}

export function getLocalDatabaseUrl(): string {
  if (isLocalSqliteConfigured()) {
    return DATABASE_URL;
  }
  return `file:${getSqliteDatabasePath()}`;
}

export function getTursoEnv(): { url: string; authToken?: string } {
  if (!DATABASE_URL) {
    throw new Error("Database URL is not configured.");
  }

  return { url: DATABASE_URL };
}

export function getDatabaseClientConfig(): { url: string; authToken?: string } {
  return getTursoEnv();
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
