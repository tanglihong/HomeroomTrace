import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase, resetDatabaseSingleton } from "@/data/db/schema";
import {
  AUTH_KEYS,
  clearAuthValue,
  migrateAuthFromLocalStorage,
  readAuthValue,
  resetAuthPersistenceForTests,
  writeAuthValue,
} from "@/lib/auth/auth-persistence";

describe("auth-persistence", () => {
  beforeEach(async () => {
    resetDatabaseSingleton();
    resetAuthPersistenceForTests();
    const db = getDatabase();
    await db.authStore.clear();
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem(k: string) {
        return store[k] ?? null;
      },
      setItem(k: string, v: string) {
        store[k] = v;
      },
      removeItem(k: string) {
        delete store[k];
      },
    });
  });

  it("persists values in IndexedDB across reads", async () => {
    await writeAuthValue(AUTH_KEYS.DEVICE_ID, "device-123");
    expect(await readAuthValue(AUTH_KEYS.DEVICE_ID)).toBe("device-123");
  });

  it("migrates existing localStorage values into IndexedDB once", async () => {
    localStorage.setItem(AUTH_KEYS.LICENSE, "jwt-token");
    await migrateAuthFromLocalStorage();
    expect(await readAuthValue(AUTH_KEYS.LICENSE)).toBe("jwt-token");
    expect(localStorage.getItem(AUTH_KEYS.LICENSE)).toBeNull();
  });

  it("clears values from IndexedDB and localStorage", async () => {
    await writeAuthValue(AUTH_KEYS.LICENSE_META, '{"username":"u1"}');
    localStorage.setItem(AUTH_KEYS.LICENSE_META, '{"username":"u1"}');
    await clearAuthValue(AUTH_KEYS.LICENSE_META);
    expect(await readAuthValue(AUTH_KEYS.LICENSE_META)).toBeNull();
    expect(localStorage.getItem(AUTH_KEYS.LICENSE_META)).toBeNull();
  });
});
