import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabase, resetDatabaseSingleton } from "@/data/db/schema";
import { DEVICE_ID_KEY, getOrCreateDeviceId } from "@/lib/auth/device-id";
import { resetAuthPersistenceForTests } from "@/lib/auth/auth-persistence";

describe("getOrCreateDeviceId", () => {
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

  it("creates and persists a UUID on first call", async () => {
    const id1 = await getOrCreateDeviceId();
    expect(id1).toMatch(/^[0-9a-f-]{36}$/);
    expect(await getOrCreateDeviceId()).toBe(id1);
    expect(localStorage.getItem(DEVICE_ID_KEY)).toBe(id1);
  });

  it("returns same id on subsequent calls", async () => {
    const id1 = await getOrCreateDeviceId();
    const id2 = await getOrCreateDeviceId();
    expect(id2).toBe(id1);
  });

  it("reads device id from IndexedDB when localStorage was cleared", async () => {
    const id1 = await getOrCreateDeviceId();
    localStorage.removeItem(DEVICE_ID_KEY);
    const id2 = await getOrCreateDeviceId();
    expect(id2).toBe(id1);
  });
});
