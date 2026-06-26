const DATABASE_URL = "file:D:/face_db.db";
const ADMIN_PASSWORD = "admin123";
const VERIFY_PASSWORD = "verify123";

function isLocalDatabaseUrl(url: string): boolean {
  return url.startsWith("file:");
}

export function isTursoConfigured(): boolean {
  if (!DATABASE_URL) return false;
  if (isLocalDatabaseUrl(DATABASE_URL)) return true;
  return false;
}

export function getTursoEnv(): { url: string; authToken?: string } {
  if (!DATABASE_URL) {
    throw new Error("Database URL is not configured.");
  }

  return { url: DATABASE_URL };
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
