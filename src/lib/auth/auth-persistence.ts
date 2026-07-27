import { getDatabase } from "@/data/db/schema";

export const AUTH_KEYS = {
  LICENSE: "ht.license",
  LICENSE_META: "ht.licenseMeta",
  DEVICE_ID: "ht.deviceId",
} as const;

let migrationPromise: Promise<void> | null = null;

/** Resets in-memory migration guard (tests only). */
export function resetAuthPersistenceForTests(): void {
  migrationPromise = null;
}

function getLocalStorage(): Pick<Storage, "getItem" | "setItem" | "removeItem"> | null {
  try {
    if (typeof window !== "undefined") return window.localStorage;
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

function readLocalStorage(key: string): string | null {
  const storage = getLocalStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(key, value);
  } catch {
    // ignore quota / private mode errors
  }
}

function removeLocalStorage(key: string): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Copies legacy localStorage auth keys into IndexedDB once per session. */
export async function migrateAuthFromLocalStorage(): Promise<void> {
  if (migrationPromise) return migrationPromise;

  migrationPromise = (async () => {
    const db = getDatabase();
    for (const key of Object.values(AUTH_KEYS)) {
      const fromLocal = readLocalStorage(key);
      if (!fromLocal) continue;

      const existing = await db.authStore.get(key);
      if (!existing?.value) {
        await db.authStore.put({ key, value: fromLocal });
      }
      removeLocalStorage(key);
    }
  })();

  return migrationPromise;
}

/** Reads an auth value, preferring IndexedDB over localStorage. */
export async function readAuthValue(key: string): Promise<string | null> {
  await migrateAuthFromLocalStorage();

  try {
    const row = await getDatabase().authStore.get(key);
    if (row?.value) return row.value;
  } catch {
    // fall through to localStorage
  }

  return readLocalStorage(key);
}

/** Persists an auth value to IndexedDB and localStorage. */
export async function writeAuthValue(key: string, value: string): Promise<void> {
  await migrateAuthFromLocalStorage();

  try {
    await getDatabase().authStore.put({ key, value });
  } catch {
    // IndexedDB may fail in rare cases; still try localStorage
  }

  writeLocalStorage(key, value);
}

/** Removes an auth value from IndexedDB and localStorage. */
export async function clearAuthValue(key: string): Promise<void> {
  try {
    await getDatabase().authStore.delete(key);
  } catch {
    // ignore
  }
  removeLocalStorage(key);
}
