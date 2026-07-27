import { importSPKI, jwtVerify } from "jose";

export interface LicensePayload {
  sub: string;
  username: string;
  deviceId: string;
}

let cachedPublicKey: CryptoKey | null = null;
let cachedPublicKeyPem: string | null = null;

/** Resolves RSA public key PEM from env or override (tests). */
export function resolvePublicKeyPem(override?: string): string | null {
  const pem = override ?? process.env.NEXT_PUBLIC_JWT_PUBLIC_KEY ?? null;
  if (!pem) return null;
  return pem.replace(/\\n/g, "\n");
}

async function getVerifyKey(publicKeyPem: string): Promise<CryptoKey> {
  if (cachedPublicKey && cachedPublicKeyPem === publicKeyPem) return cachedPublicKey;
  cachedPublicKey = await importSPKI(publicKeyPem, "RS256");
  cachedPublicKeyPem = publicKeyPem;
  return cachedPublicKey;
}

/**
 * Offline-validates a License JWT against public key and deviceId.
 * Returns payload or null if invalid, expired, or device mismatch.
 */
export async function validateLicense(
  license: string,
  currentDeviceId: string,
  publicKeyPemOverride?: string,
): Promise<LicensePayload | null> {
  const pem = resolvePublicKeyPem(publicKeyPemOverride);
  if (!pem) return null;

  try {
    const key = await getVerifyKey(pem);
    const { payload } = await jwtVerify(license, key, { algorithms: ["RS256"] });

    const username = payload.username;
    const deviceId = payload.deviceId;
    const sub = payload.sub;

    if (typeof sub !== "string" || typeof username !== "string" || typeof deviceId !== "string") {
      return null;
    }
    if (deviceId !== currentDeviceId) return null;

    return { sub, username, deviceId };
  } catch {
    return null;
  }
}
