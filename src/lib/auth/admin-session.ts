const ADMIN_TOKEN_KEY = "ht.adminToken";
const ADMIN_USER_KEY = "ht.adminUser";

/** Saves admin session token and username to sessionStorage. */
export function saveAdminSession(token: string, username: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_USER_KEY, username);
  } catch {
    // ignore
  }
}

/** Returns stored admin token or null. */
export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/** Returns stored admin username or null. */
export function getAdminUsername(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return sessionStorage.getItem(ADMIN_USER_KEY);
  } catch {
    return null;
  }
}

/** Clears admin session. */
export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_USER_KEY);
  } catch {
    // ignore
  }
}
