import { describe, expect, it } from "vitest";
import {
  hasMeaningfulDraftContent,
  serializeRecordDraftSnapshot,
  shouldShowAutosaveDraftHint,
  shouldWriteAutosaveDraft,
} from "@/lib/record-draft";

const emptyDraft = {
  title: "纪律登记-2026-07-24",
  happenedAt: "2026-07-24",
  location: "",
  content: "",
  followUp: "",
  followUpDueAt: "",
  studentIds: [] as string[],
  attachments: [] as { kind: "photo" | "audio"; relativePath: string; duration?: number }[],
};

describe("shouldWriteAutosaveDraft", () => {
  it("does not write when user has not edited", () => {
    expect(shouldWriteAutosaveDraft({ hasUserEdited: false, hasPendingDraftPrompt: false })).toBe(false);
  });

  it("does not write while draft restore prompt is visible", () => {
    expect(shouldWriteAutosaveDraft({ hasUserEdited: true, hasPendingDraftPrompt: true })).toBe(false);
  });

  it("writes only after user edited and no pending prompt", () => {
    expect(shouldWriteAutosaveDraft({ hasUserEdited: true, hasPendingDraftPrompt: false })).toBe(true);
  });
});

describe("hasMeaningfulDraftContent", () => {
  it("returns false for auto title only", () => {
    expect(hasMeaningfulDraftContent(emptyDraft)).toBe(false);
  });

  it("returns true when body content exists", () => {
    expect(hasMeaningfulDraftContent({ ...emptyDraft, content: "test" })).toBe(true);
  });

  it("returns true when students or attachments exist", () => {
    expect(hasMeaningfulDraftContent({ ...emptyDraft, studentIds: ["s1"] })).toBe(true);
    expect(
      hasMeaningfulDraftContent({
        ...emptyDraft,
        attachments: [{ kind: "photo", relativePath: "records/a.jpg" }],
      }),
    ).toBe(true);
  });
});

describe("shouldShowAutosaveDraftHint", () => {
  it("does not show hint for empty meaningful content", () => {
    expect(shouldShowAutosaveDraftHint(emptyDraft)).toBe(false);
  });

  it("shows hint when draft has meaningful content", () => {
    expect(shouldShowAutosaveDraftHint({ ...emptyDraft, content: "note" })).toBe(true);
  });
});

describe("serializeRecordDraftSnapshot", () => {
  it("produces stable snapshots for unchanged drafts", () => {
    const first = serializeRecordDraftSnapshot({ ...emptyDraft, content: "same" });
    const second = serializeRecordDraftSnapshot({ ...emptyDraft, content: "same" });
    expect(first).toBe(second);
  });

  it("changes snapshot when draft content changes", () => {
    const before = serializeRecordDraftSnapshot(emptyDraft);
    const after = serializeRecordDraftSnapshot({ ...emptyDraft, content: "updated" });
    expect(before).not.toBe(after);
  });
});
