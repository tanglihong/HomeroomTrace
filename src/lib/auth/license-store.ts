const LICENSE_KEY = "ht.license";
const LICENSE_META_KEY = "ht.licenseMeta";

export interface LicenseMeta {
  username: string;
  displayName?: string;
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** Persists License JWT and display metadata locally. */
export function saveLicense(license: string, meta: LicenseMeta): void {
  writeStorage(LICENSE_KEY, license);
  writeStorage(LICENSE_META_KEY, JSON.stringify(meta));
}

/** Returns stored License JWT or null. */
export function getLicense(): string | null {
  return readStorage(LICENSE_KEY);
}

/** Returns stored license metadata or null. */
export function getLicenseMeta(): LicenseMeta | null {
  const raw = readStorage(LICENSE_META_KEY);
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
export function clearLicense(): void {
  removeStorage(LICENSE_KEY);
  removeStorage(LICENSE_META_KEY);
}
