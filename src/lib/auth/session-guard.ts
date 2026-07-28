import { checkSession } from "@/lib/auth/auth-api";
import { getOrCreateDeviceId } from "@/lib/auth/device-id";
import { clearLicense, getLicense } from "@/lib/auth/license-store";
import { validateLicense } from "@/lib/auth/license-validator";

const SESSION_RECHECK_MS = 5 * 60 * 1000;

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine;
}

/** Returns false when server revoked the session (deleted/disabled/unbound account). */
export async function verifyServerSession(license: string): Promise<boolean> {
  if (!isOnline()) return true;
  const result = await checkSession(license);
  return result !== "revoked";
}

/** Clears local license when server says session is no longer valid. Returns whether revoked. */
export async function revokeSessionIfNeeded(): Promise<boolean> {
  const license = await getLicense();
  if (!license) return false;

  const deviceId = await getOrCreateDeviceId();
  const payload = await validateLicense(license, deviceId);
  if (!payload) {
    await clearLicense();
    return true;
  }

  if (!isOnline()) return false;

  const result = await checkSession(license);
  if (result !== "revoked") return false;

  await clearLicense();
  return true;
}

/** Polls server while app is authorized and online; invokes callback when session revoked. */
export function startSessionGuard(onRevoked: () => void): () => void {
  let checking = false;

  const runCheck = async () => {
    if (checking) return;
    checking = true;
    try {
      const revoked = await revokeSessionIfNeeded();
      if (revoked) onRevoked();
    } finally {
      checking = false;
    }
  };

  const onVisible = () => {
    if (document.visibilityState === "visible") void runCheck();
  };
  const onOnline = () => void runCheck();

  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);
  const interval = window.setInterval(() => void runCheck(), SESSION_RECHECK_MS);

  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
    window.clearInterval(interval);
  };
}
