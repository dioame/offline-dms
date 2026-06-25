import { clearAuthSession } from "./db";

export const ADMIN_STORAGE_KEY = "dms_admin_password";
export const VERIFY_STORAGE_KEY = "dms_verify_password";

export async function logoutApp(): Promise<void> {
  if (typeof window === "undefined") return;

  sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  sessionStorage.removeItem(VERIFY_STORAGE_KEY);

  try {
    await clearAuthSession();
  } catch {
    // IndexedDB may be unavailable; still clear browser session keys.
  }

  window.dispatchEvent(new Event("dms:logout"));
}
