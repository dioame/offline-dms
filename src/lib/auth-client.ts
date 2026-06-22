import { v4 as uuidv4 } from "uuid";
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
  type AuthSession,
} from "./db";

export type { AuthSession };

const DEVICE_SESSION_KEY = "dms_device_session_id";

function getOrCreateDeviceSessionId(): string {
  if (typeof window === "undefined") {
    return uuidv4();
  }
  const existing = localStorage.getItem(DEVICE_SESSION_KEY);
  if (existing) {
    return existing;
  }
  const sessionId = uuidv4();
  localStorage.setItem(DEVICE_SESSION_KEY, sessionId);
  return sessionId;
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    return {} as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Unexpected server response.");
  }
}

export async function getStoredSession(): Promise<AuthSession | undefined> {
  const session = await getAuthSession();
  if (!session?.sessionId) {
    return undefined;
  }
  return session;
}

export async function loginWithCode(code: string): Promise<void> {
  if (!navigator.onLine) {
    throw new Error(
      "You must be online to sign in with an access code for the first time.",
    );
  }

  const sessionId = getOrCreateDeviceSessionId();

  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, sessionId }),
  });

  const data = await parseJsonResponse<{
    success?: boolean;
    code?: string;
    sessionId?: string;
    enumerator_name?: string | null;
    enumerator_email?: string | null;
    error?: string;
  }>(res);

  if (!res.ok) {
    throw new Error(data.error || "Invalid access code.");
  }

  await saveAuthSession(data.code || code, data.sessionId || sessionId, {
    enumeratorName: data.enumerator_name,
    enumeratorEmail: data.enumerator_email,
  });
}

export async function validateStoredSessionOnline(): Promise<boolean> {
  const session = await getAuthSession();
  if (!session?.sessionId) {
    return false;
  }

  if (!navigator.onLine) {
    return true;
  }

  try {
    const res = await fetch("/api/auth/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: session.code,
        sessionId: session.sessionId,
      }),
    });

    const data = await parseJsonResponse<{
      valid?: boolean;
      enumerator_name?: string | null;
      enumerator_email?: string | null;
    }>(res);
    if (!res.ok || !data.valid) {
      await clearAuthSession();
      return false;
    }

    await saveAuthSession(session.code, session.sessionId, {
      enumeratorName: data.enumerator_name,
      enumeratorEmail: data.enumerator_email,
    });

    return true;
  } catch {
    return true;
  }
}

export async function logout(): Promise<void> {
  await clearAuthSession();
}
