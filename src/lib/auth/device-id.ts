import { v4 as uuidv4 } from "uuid";

/** localStorage key for persistent device identifier */
export const DEVICE_ID_KEY = "ht.deviceId";

function getStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    if (typeof window !== "undefined") return window.localStorage;
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

function readStorage(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // ignore quota / private mode errors
  }
}

/** Returns existing deviceId or creates a new UUID v4 and persists it. */
export function getOrCreateDeviceId(): string {
  const existing = readStorage(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = uuidv4();
  writeStorage(DEVICE_ID_KEY, id);
  return id;
}
