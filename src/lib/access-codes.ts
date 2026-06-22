import { getTursoClient, ensureTursoSchema } from "./turso";
import { generateAccessCode, normalizeAccessCode } from "./code-generator";

export type AccessCodeStatus = "active" | "used" | "rejected";

export type AccessCodeRow = {
  code: string;
  status: AccessCodeStatus;
  created_at: string;
  rejected_at: string | null;
  used_at: string | null;
  session_id: string | null;
  last_used_at: string | null;
};

function rowToAccessCode(row: Record<string, unknown>): AccessCodeRow {
  return {
    code: String(row.code),
    status: row.status as AccessCodeStatus,
    created_at: String(row.created_at),
    rejected_at: row.rejected_at ? String(row.rejected_at) : null,
    used_at: row.used_at ? String(row.used_at) : null,
    session_id: row.session_id ? String(row.session_id) : null,
    last_used_at: row.last_used_at ? String(row.last_used_at) : null,
  };
}

async function getCodeRow(code: string): Promise<AccessCodeRow | null> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const result = await db.execute({
    sql: `
      SELECT code, status, created_at, rejected_at, used_at, session_id, last_used_at
      FROM access_codes
      WHERE code = ?
    `,
    args: [code],
  });
  if (result.rows.length === 0) return null;
  return rowToAccessCode(result.rows[0] as Record<string, unknown>);
}

export async function listAccessCodes(): Promise<AccessCodeRow[]> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const result = await db.execute({
    sql: `
      SELECT code, status, created_at, rejected_at, used_at, session_id, last_used_at
      FROM access_codes
      ORDER BY created_at DESC
    `,
  });
  return result.rows.map((row) => rowToAccessCode(row as Record<string, unknown>));
}

/** Read-only check for an existing device session (does not consume a code). */
export async function checkAccessCode(
  rawCode: string,
  sessionId: string,
): Promise<{ valid: boolean; reason?: string }> {
  const code = normalizeAccessCode(rawCode);
  if (!code) {
    return { valid: false, reason: "Please enter an access code." };
  }
  if (!sessionId.trim()) {
    return { valid: false, reason: "Session is invalid." };
  }

  const row = await getCodeRow(code);
  if (!row) {
    return { valid: false, reason: "Invalid access code." };
  }
  if (row.status === "rejected") {
    return { valid: false, reason: "This access code has been rejected." };
  }
  if (row.status === "used") {
    if (row.session_id === sessionId.trim()) {
      return { valid: true };
    }
    return {
      valid: false,
      reason: "This access code is already in use on another device.",
    };
  }

  return {
    valid: false,
    reason: "This access code has not been activated on this device.",
  };
}

/** First-time login: atomically bind code to one device session. */
export async function redeemAccessCode(
  rawCode: string,
  sessionId: string,
): Promise<{ valid: boolean; reason?: string }> {
  const code = normalizeAccessCode(rawCode);
  if (!code) {
    return { valid: false, reason: "Please enter an access code." };
  }
  if (!sessionId.trim()) {
    return { valid: false, reason: "Session is invalid." };
  }

  await ensureTursoSchema();
  const db = getTursoClient();
  const now = new Date().toISOString();

  const redeem = await db.execute({
    sql: `
      UPDATE access_codes
      SET status = 'used', used_at = ?, session_id = ?, last_used_at = ?
      WHERE code = ? AND status = 'active'
    `,
    args: [now, sessionId.trim(), now, code],
  });

  if (redeem.rowsAffected > 0) {
    return { valid: true };
  }

  const row = await getCodeRow(code);
  if (!row) {
    return { valid: false, reason: "Invalid access code." };
  }
  if (row.status === "rejected") {
    return { valid: false, reason: "This access code has been rejected." };
  }
  if (row.status === "used") {
    if (row.session_id === sessionId.trim()) {
      return { valid: true };
    }
    return {
      valid: false,
      reason: "This access code has already been used and cannot be shared.",
    };
  }

  return { valid: false, reason: "Unable to activate this access code." };
}

export async function generateAccessCodes(count: number): Promise<string[]> {
  await ensureTursoSchema();
  const db = getTursoClient();
  const created: string[] = [];
  const now = new Date().toISOString();
  let attempts = 0;
  const maxAttempts = count * 10;

  while (created.length < count && attempts < maxAttempts) {
    attempts++;
    const code = generateAccessCode();
    if (created.includes(code)) continue;

    try {
      await db.execute({
        sql: `
          INSERT INTO access_codes (code, status, created_at)
          VALUES (?, 'active', ?)
        `,
        args: [code, now],
      });
      created.push(code);
    } catch {
      // collision — try another code
    }
  }

  if (created.length < count) {
    throw new Error("Could not generate enough unique codes. Try again.");
  }

  return created;
}

export async function addAccessCode(rawCode: string): Promise<string> {
  const code = normalizeAccessCode(rawCode);
  if (!code) {
    throw new Error("Code is required.");
  }
  if (!/^FACED-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(code) && code.length < 6) {
    throw new Error("Code must be at least 6 characters or match FACED-XXXX-XXXX format.");
  }

  await ensureTursoSchema();
  const db = getTursoClient();
  const now = new Date().toISOString();

  await db.execute({
    sql: `
      INSERT INTO access_codes (code, status, created_at)
      VALUES (?, 'active', ?)
    `,
    args: [code, now],
  });

  return code;
}

export async function rejectAccessCode(rawCode: string): Promise<void> {
  const code = normalizeAccessCode(rawCode);
  await ensureTursoSchema();
  const db = getTursoClient();
  const now = new Date().toISOString();

  const result = await db.execute({
    sql: `
      UPDATE access_codes
      SET status = 'rejected', rejected_at = ?
      WHERE code = ? AND status != 'rejected'
    `,
    args: [now, code],
  });

  if (result.rowsAffected === 0) {
    throw new Error("Code not found or already rejected.");
  }
}

export async function reactivateAccessCode(rawCode: string): Promise<void> {
  const code = normalizeAccessCode(rawCode);
  await ensureTursoSchema();
  const db = getTursoClient();

  const result = await db.execute({
    sql: `
      UPDATE access_codes
      SET
        status = 'active',
        rejected_at = NULL,
        used_at = NULL,
        session_id = NULL,
        last_used_at = NULL
      WHERE code = ?
    `,
    args: [code],
  });

  if (result.rowsAffected === 0) {
    throw new Error("Code not found.");
  }
}
