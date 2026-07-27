import { v4 as uuidv4 } from "uuid";
import { AUTH_KEYS, readAuthValue, writeAuthValue } from "@/lib/auth/auth-persistence";

/** IndexedDB key for persistent device identifier */
export const DEVICE_ID_KEY = AUTH_KEYS.DEVICE_ID;

/** Returns existing deviceId or creates a new UUID v4 and persists it. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await readAuthValue(AUTH_KEYS.DEVICE_ID);
  if (existing) return existing;
  const id = uuidv4();
  await writeAuthValue(AUTH_KEYS.DEVICE_ID, id);
  return id;
}
