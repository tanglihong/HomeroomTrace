import {
  AUTH_KEYS,
  clearAuthValue,
  readAuthValue,
  writeAuthValue,
} from "@/lib/auth/auth-persistence";

export interface LicenseMeta {
  username: string;
  displayName?: string;
}

/** Persists License JWT and display metadata locally. */
export async function saveLicense(license: string, meta: LicenseMeta): Promise<void> {
  await writeAuthValue(AUTH_KEYS.LICENSE, license);
  await writeAuthValue(AUTH_KEYS.LICENSE_META, JSON.stringify(meta));
}

/** Returns stored License JWT or null. */
export async function getLicense(): Promise<string | null> {
  return readAuthValue(AUTH_KEYS.LICENSE);
}

/** Returns stored license metadata or null. */
export async function getLicenseMeta(): Promise<LicenseMeta | null> {
  const raw = await readAuthValue(AUTH_KEYS.LICENSE_META);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed == null) return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj.username !== "string") return null;
    return {
      username: obj.username,
      displayName: typeof obj.displayName === "string" ? obj.displayName : undefined,
    };
  } catch {
    return null;
  }
}

/** Clears local License and metadata (logout). */
export async function clearLicense(): Promise<void> {
  await clearAuthValue(AUTH_KEYS.LICENSE);
  await clearAuthValue(AUTH_KEYS.LICENSE_META);
}
