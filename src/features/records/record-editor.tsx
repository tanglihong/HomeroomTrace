"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_WORK_RECORD_TYPES, RecordTypeConfig, type WorkRecordType } from "@/domain/models/work-record-type";
import type { AttachmentDraft, RecordTemplateDTO, WorkRecordDraft } from "@/domain/use-cases/repositories";
import { AttachmentPreview } from "@/features/records/attachment-preview";
import { IconCamera, IconMic } from "@/features/common/icons";
import {
  IOSActionRow,
  IOSFileButton,
  IOSFormRow,
  IOSFormSection,
} from "@/features/common/ios-form";
import { IOSNavBar, IOSNavButton } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useDataStore } from "@/lib/data-store";
import { useAppContainer } from "@/lib/app-container";
import { parseDateInput, toDateInputValue } from "@/lib/format";
import { pickAudioRecordingFormat } from "@/lib/audio-recording";

interface RecordEditorProps {
  mode: "create" | "edit";
  recordId?: string;
  initialType?: WorkRecordType;
}

export function RecordEditor({ mode, recordId, initialType = "classDiary" }: RecordEditorProps) {
  const container = useAppContainer();
  const { students: cachedStudents, upsertRecord } = useDataStore();
  const toast = useToast();
  const router = useRouter();
  const [type, setType] = useState<WorkRecordType>(initialType);
  const [title, setTitle] = useState("");
  const [happenedAt, setHappenedAt] = useState(toDateInputValue(new Date()));
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [templates, setTemplates] = useState<RecordTemplateDTO[]>([]);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingFormatRef = useRef(pickAudioRecordingFormat());
  const [recording, setRecording] = useState(false);

  const config = RecordTypeConfig.configuration(type);
  const students = cachedStudents ?? [];

  useEffect(() => {
    void container.templates.list(type).then(setTemplates).catch(() => {});
  }, [container.templates, type]);

  useEffect(() => {
    if (mode !== "edit" || !recordId) return;
    void (async () => {
      const record = await container.records.find(recordId);
      if (!record) return;
      setType(record.type);
      setTitle(record.title);
      setHappenedAt(toDateInputValue(record.happenedAt));
      setLocation(record.location ?? "");
      setContent(record.content);
      setFollowUp(record.followUp ?? "");
      setStudentIds(record.studentIds);
      setAttachments(record.attachments.map((a) => ({ kind: a.kind, relativePath: a.relativePath, duration: a.duration })));
    })();
  }, [container.records, mode, recordId]);

  useEffect(() => {
    if (mode !== "create") return;
    setTitle(`${RecordTypeConfig.configuration(initialType).titlePrefix}-${toDateInputValue(new Date())}`);
  }, [mode, initialType]);

  const buildDraft = (): WorkRecordDraft => ({
    classId: container.requireClassId(),
    type,
    title,
    happenedAt: parseDateInput(happenedAt),
    location: location || undefined,
    studentIds,
    content,
    followUp: followUp || undefined,
    attachments,
  });

  const save = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    try {
      const draft = buildDraft();
      let id: string;
      if (mode === "edit" && recordId) {
        await container.records.update(recordId, draft);
        id = recordId;
      } else {
        id = await container.records.add(draft);
      }
      const saved = await container.records.find(id);
      if (saved) upsertRecord(saved);
      toast.show("保存成功");
      router.replace(`/records/detail?id=${id}`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "保存失败", true);
    } finally {
      setSaving(false);
      savingRef.current = false;
    }
  };

  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await container.mediaStore.save(file, "records", "jpg");
      setAttachments((prev) => [...prev, { kind: "photo", relativePath: path }]);
      toast.show("照片已添加");
    } catch {
      toast.show("照片保存失败", true);
    }
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      let format = pickAudioRecordingFormat();
      recordingFormatRef.current = format;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, { mimeType: format.mimeType });
      } catch {
        recorder = new MediaRecorder(stream);
        format = {
          mimeType: recorder.mimeType || format.mimeType,
          extension: format.extension,
        };
        recordingFormatRef.current = format;
      }
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (audioChunksRef.current.length === 0) {
          toast.show("录音太短，请重试", true);
          return;
        }
        const blob = new Blob(audioChunksRef.current, { type: format.mimeType });
        try {
          const path = await container.mediaStore.save(blob, "records", format.extension);
          setAttachments((prev) => [...prev, { kind: "audio", relativePath: path }]);
          toast.show("录音已添加");
        } catch {
          toast.show("录音保存失败", true);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start(250);
      setRecording(true);
    } catch {
      toast.show("无法访问麦克风", true);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.requestData();
      recorder.stop();
    }
    setRecording(false);
  };

  const toggleStudent = (id: string) => {
    setStudentIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <IOSNavBar
        title={mode === "create" ? "新建留痕" : "编辑留痕"}
        backHref={recordId ? `/records/detail?id=${recordId}` : "/workbench"}
        right={
          <IOSNavButton onClick={save} disabled={saving}>
            {saving ? "保存中" : "保存"}
          </IOSNavButton>
        }
      />
      <div className="page-content">
        <IOSFormSection title="基本信息">
          <IOSFormRow label="类型">
            <select value={type} onChange={(e) => setType(e.target.value as WorkRecordType)} disabled={mode === "edit"}>
              {ALL_WORK_RECORD_TYPES.map((t) => (
                <option key={t} value={t}>
                  {RecordTypeConfig.configuration(t).displayName}
                </option>
              ))}
            </select>
          </IOSFormRow>
          <IOSFormRow label="标题">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="必填" />
          </IOSFormRow>
          <IOSFormRow label="日期">
            <input type="date" value={happenedAt} onChange={(e) => setHappenedAt(e.target.value)} />
          </IOSFormRow>
          {config.fields.includes("location") && (
            <IOSFormRow label="地点">
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="选填" />
            </IOSFormRow>
          )}
        </IOSFormSection>

        {config.prefersStudents && (
          <IOSFormSection title="关联学生" footer={studentIds.length > 0 ? `已选 ${studentIds.length} 人` : "点击选择学生"}>
            {students.length === 0 ? (
              <div className="ios-form-row">
                <span className="record-subtitle">请先在学生 Tab 添加名册</span>
              </div>
            ) : (
              students.map((s) => (
                <div key={s.id} className="ios-form-row">
                  <button type="button" className="ios-form-check-row" onClick={() => toggleStudent(s.id)}>
                    <input type="checkbox" readOnly checked={studentIds.includes(s.id)} tabIndex={-1} />
                    <span>
                      {s.name}
                      <span className="record-subtitle"> · {s.studentNo}</span>
                    </span>
                  </button>
                </div>
              ))
            )}
          </IOSFormSection>
        )}

        {templates.length > 0 && (
          <IOSFormSection title="模板">
            <IOSFormRow label="选择">
              <select
                defaultValue=""
                onChange={(e) => {
                  const tpl = templates.find((t) => t.id === e.target.value);
                  if (tpl) setContent(tpl.bodySkeleton);
                }}
              >
                <option value="">选择模板…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </IOSFormRow>
          </IOSFormSection>
        )}

        <IOSFormSection title="内容">
          <IOSFormRow label="正文" stack>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="填写留痕内容…" />
          </IOSFormRow>
          {config.fields.includes("followUp") && (
            <IOSFormRow label="跟进" stack>
              <textarea value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="后续跟进计划…" />
            </IOSFormRow>
          )}
        </IOSFormSection>

        <IOSFormSection
          title="附件"
          footer={`已添加 ${attachments.length} 个附件${recording ? " · 正在录音…" : ""}`}
        >
          <IOSFileButton accept="image/*" onChange={onPhotoSelected} icon={<IconCamera size={20} />}>
            添加照片
          </IOSFileButton>
          {recording ? (
            <IOSActionRow destructive icon={<IconMic size={20} />} onClick={stopRecording}>
              停止录音
            </IOSActionRow>
          ) : (
            <IOSActionRow icon={<IconMic size={20} />} onClick={startRecording}>
              开始录音
            </IOSActionRow>
          )}
          {attachments.length > 0 && (
            <div className="attachment-grid">
              {attachments.map((attachment, index) => (
                <div key={`${attachment.relativePath}-${index}`} className="attachment-thumb">
                  <AttachmentPreview path={attachment.relativePath} kind={attachment.kind} compact />
                  <button
                    type="button"
                    className="attachment-thumb-remove"
                    aria-label="移除附件"
                    onClick={() => removeAttachment(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </IOSFormSection>
      </div>
    </>
  );
}
