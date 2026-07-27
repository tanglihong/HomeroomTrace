import crypto from "crypto";
import { describe, expect, it } from "vitest";
import { SignJWT, importPKCS8 } from "jose";
import { validateLicense } from "@/lib/auth/license-validator";

const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

async function signTestLicense(payload: { sub: string; username: string; deviceId: string }, expiresInSec?: number) {
  const key = await importPKCS8(privateKey, "RS256");
  const builder = new SignJWT(payload).setProtectedHeader({ alg: "RS256" }).setSubject(payload.sub);
  if (expiresInSec != null) {
    builder.setExpirationTime(`${expiresInSec}s`);
  } else {
    builder.setExpirationTime("1h");
  }
  return builder.sign(key);
}

describe("validateLicense", () => {
  it("returns payload when token is valid and deviceId matches", async () => {
    const deviceId = "device-abc-123";
    const license = await signTestLicense({ sub: "acc1", username: "teacher01", deviceId });
    const result = await validateLicense(license, deviceId, publicKey);
    expect(result).toEqual({ sub: "acc1", username: "teacher01", deviceId });
  });

  it("returns null when deviceId mismatch", async () => {
    const license = await signTestLicense({ sub: "acc1", username: "teacher01", deviceId: "device-a" });
    const result = await validateLicense(license, "device-b", publicKey);
    expect(result).toBeNull();
  });

  it("returns null when token expired", async () => {
    const deviceId = "device-abc";
    const license = await signTestLicense({ sub: "acc1", username: "teacher01", deviceId }, -10);
    const result = await validateLicense(license, deviceId, publicKey);
    expect(result).toBeNull();
  });

  it("returns null when token malformed", async () => {
    const result = await validateLicense("not-a-jwt", "device-abc", publicKey);
    expect(result).toBeNull();
  });
});
