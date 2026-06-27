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

  if (!url || !authToken) {
    throw new Error(
      "Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN. Copy .env.example to .env and add your Turso credentials.",
    );
  }

  return { url, authToken };
}

export function getDatabaseClientConfig(): { url: string; authToken?: string } {
  if (isRemoteTursoConfigured()) {
    return getTursoEnv();
  }
  return { url: getLocalDatabaseUrl() };
}

export function getSyncApiSecret(): string | undefined {
  return process.env.SYNC_API_SECRET?.trim() || undefined;
}

export function getAdminPassword(): string | undefined {
  return process.env.ADMIN_PASSWORD?.trim() || undefined;
}

export function verifyAdminPassword(password: string): boolean {
  const expected = getAdminPassword();
  if (!expected) {
    return false;
  }
  return password === expected;
}

export function getVerifyPassword(): string {
  return process.env.VERIFY_PASSWORD?.trim() || "verify123";
}

export function verifyVerifyPassword(password: string): boolean {
  return password === getVerifyPassword();
}
