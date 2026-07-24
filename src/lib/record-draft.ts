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

/** 是否应写入自动保存草稿：仅用户主动编辑后，且未显示恢复提示时。 */
export function shouldWriteAutosaveDraft(options: {
  hasUserEdited: boolean;
  hasPendingDraftPrompt: boolean;
}): boolean {
  return options.hasUserEdited && !options.hasPendingDraftPrompt;
}

/** 草稿是否包含用户实质填写的内容（不含仅自动生成的标题）。 */
export function hasMeaningfulDraftContent(draft: Omit<RecordEditorDraft, "savedAt">): boolean {
  return (
    draft.content.trim().length > 0 ||
    draft.location.trim().length > 0 ||
    draft.followUp.trim().length > 0 ||
    draft.studentIds.length > 0 ||
    draft.attachments.length > 0
  );
}

/** 是否应展示自动保存提示：需有实质内容，避免空表单或仅恢复草稿时打扰用户。 */
export function shouldShowAutosaveDraftHint(draft: Omit<RecordEditorDraft, "savedAt">): boolean {
  return hasMeaningfulDraftContent(draft);
}

export function serializeRecordDraftSnapshot(draft: Omit<RecordEditorDraft, "savedAt">): string {
  return JSON.stringify({
    title: draft.title,
    happenedAt: draft.happenedAt,
    location: draft.location,
    content: draft.content,
    followUp: draft.followUp,
    followUpDueAt: draft.followUpDueAt,
    studentIds: draft.studentIds,
    attachments: draft.attachments,
  });
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
