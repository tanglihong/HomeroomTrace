import { describe, expect, it, beforeEach, vi } from "vitest";
import { getOrCreateDeviceId, DEVICE_ID_KEY } from "@/lib/auth/device-id";

describe("getOrCreateDeviceId", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      store,
      getItem(k: string) {
        return store[k] ?? null;
      },
      setItem(k: string, v: string) {
        store[k] = v;
      },
    });
  });

  it("creates and persists a UUID on first call", () => {
    const id1 = getOrCreateDeviceId();
    expect(id1).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem(DEVICE_ID_KEY)).toBe(id1);
  });

  it("returns same id on subsequent calls", () => {
    const id1 = getOrCreateDeviceId();
    const id2 = getOrCreateDeviceId();
    expect(id2).toBe(id1);
  });
});
