import type { WorkRecordType } from "@/domain/models/work-record-type";

const RECENT_TYPES_KEY = "ht.recentRecordTypes";
const LAST_BACKUP_KEY = "ht.lastBackupAt";

export const BACKUP_REMINDER_DAYS = 7;

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
    // ignore quota / private mode errors
  }
}

/** 最近使用的留痕类型（最多 3 个，按使用时间倒序）。 */
export function getRecentRecordTypes(): WorkRecordType[] {
  const raw = readStorage(RECENT_TYPES_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is WorkRecordType => typeof item === "string").slice(0, 3);
  } catch {
    return [];
  }
}

/** 记录一次留痕类型使用，将其移到最近列表首位。 */
export function trackRecordType(type: WorkRecordType): void {
  const recent = getRecentRecordTypes().filter((item) => item !== type);
  writeStorage(RECENT_TYPES_KEY, JSON.stringify([type, ...recent].slice(0, 3)));
}

/** 上次备份时间戳（毫秒），未备份过返回 null。 */
export function getLastBackupAt(): number | null {
  const raw = readStorage(LAST_BACKUP_KEY);
  if (!raw) return null;
  const ts = Number(raw);
  return Number.isFinite(ts) ? ts : null;
}

export function setLastBackupAt(ts: number): void {
  writeStorage(LAST_BACKUP_KEY, String(ts));
}

/** 是否已超过 BACKUP_REMINDER_DAYS 未备份。 */
export function needsBackupReminder(): boolean {
  const last = getLastBackupAt();
  if (last == null) return true;
  const elapsedMs = Date.now() - last;
  return elapsedMs >= BACKUP_REMINDER_DAYS * 24 * 60 * 60 * 1000;
}
