import "fake-indexeddb/auto";
import crypto from "crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignJWT, importPKCS8 } from "jose";
import { getDatabase, resetDatabaseSingleton } from "@/data/db/schema";
import { getOrCreateDeviceId } from "@/lib/auth/device-id";
import { resetAuthPersistenceForTests } from "@/lib/auth/auth-persistence";
import { getLicense, saveLicense } from "@/lib/auth/license-store";
import { validateLicense } from "@/lib/auth/license-validator";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

async function signTestLicense(payload: { sub: string; username: string; deviceId: string }) {
  const key = await importPKCS8(privateKey, "RS256");
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .setSubject(payload.sub)
    .setExpirationTime("1h")
    .sign(key);
}

describe("auth bootstrap persistence", () => {
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

  it("keeps login valid after simulated page refresh", async () => {
    const deviceId = await getOrCreateDeviceId();
    const license = await signTestLicense({ sub: "acc1", username: "teacher01", deviceId });
    await saveLicense(license, { username: "teacher01", displayName: "张老师" });

    const stored = await getLicense();
    expect(stored).toBe(license);

    const deviceAfterRefresh = await getOrCreateDeviceId();
    const payload = await validateLicense(stored!, deviceAfterRefresh, publicKey);
    expect(payload).toEqual({ sub: "acc1", username: "teacher01", deviceId });
  });
});
