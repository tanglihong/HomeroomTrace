import type { WorkRecordType } from "@/domain/models/work-record-type";
import type { AttachmentDraft } from "@/domain/use-cases/repositories";

const DRAFT_PREFIX = "ht.recordDraft.";

export type RecordEditorMode = "create" | "edit";

export interface RecordEditorDraft {
  title: string;
  happenedAt: string;
  location: string;
  content: string;
  followUp: string;
  followUpDueAt: string;
  studentIds: string[];
  attachments: AttachmentDraft[];
  savedAt: number;
}

function draftKey(mode: RecordEditorMode, recordId: string | undefined, type: WorkRecordType): string {
  return `${DRAFT_PREFIX}${mode}:${recordId ?? "new"}:${type}`;
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
    // ignore quota / private mode errors
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

/** 保存留痕编辑器草稿。 */
export function saveRecordDraft(
  mode: RecordEditorMode,
  recordId: string | undefined,
  type: WorkRecordType,
  draft: Omit<RecordEditorDraft, "savedAt">,
): void {
  const payload: RecordEditorDraft = { ...draft, savedAt: Date.now() };
  writeStorage(draftKey(mode, recordId, type), JSON.stringify(payload));
}

/** 读取留痕编辑器草稿，不存在或解析失败时返回 null。 */
export function loadRecordDraft(
  mode: RecordEditorMode,
  recordId: string | undefined,
  type: WorkRecordType,
): RecordEditorDraft | null {
  const raw = readStorage(draftKey(mode, recordId, type));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RecordEditorDraft;
    if (typeof parsed.title !== "string" || typeof parsed.happenedAt !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

/** 清除留痕编辑器草稿。 */
export function clearRecordDraft(
  mode: RecordEditorMode,
  recordId: string | undefined,
  type: WorkRecordType,
): void {
  removeStorage(draftKey(mode, recordId, type));
}
