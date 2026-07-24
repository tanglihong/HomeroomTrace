"use client";



import { useEffect, useRef, useState, useMemo, useCallback } from "react";

import Link from "next/link";

import { useRouter } from "next/navigation";

import { ALL_WORK_RECORD_TYPES, RecordTypeConfig, type WorkRecordType } from "@/domain/models/work-record-type";

import type { AttachmentDraft, RecordTemplateDTO, WorkRecordDraft } from "@/domain/use-cases/repositories";

import { AttachmentPreview } from "@/features/records/attachment-preview";

import { StudentPickerSheet } from "@/features/records/student-picker-sheet";

import { IconCamera, IconMic } from "@/features/common/icons";

import {

  IOSActionRow,

  IOSFileButton,

  IOSFormRow,

  IOSFormSection,

} from "@/features/common/ios-form";

import { IOSNavBar, IOSNavButton } from "@/features/common/ios-nav-bar";

import { LoadingOverlay } from "@/features/common/ios-list";

import { useToast } from "@/features/common/toast";

import { useDataStore } from "@/lib/data-store";

import { useAppContainer } from "@/lib/app-container";

import { trackRecordType } from "@/lib/app-preferences";

import { parseDateInput, toDateInputValue } from "@/lib/format";

import { pickAudioRecordingFormat } from "@/lib/audio-recording";

import { compressImage } from "@/lib/image-compress";

import { clearRecordDraft, loadRecordDraft, saveRecordDraft, type RecordEditorDraft } from "@/lib/record-draft";



interface RecordEditorProps {

  mode: "create" | "edit";

  recordId?: string;

  initialType?: WorkRecordType;

  initialTemplateId?: string;

}



export function RecordEditor({ mode, recordId, initialType = "classDiary", initialTemplateId }: RecordEditorProps) {

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

  const [followUpDueAt, setFollowUpDueAt] = useState("");

  const [studentIds, setStudentIds] = useState<string[]>([]);

  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);

  const [templates, setTemplates] = useState<RecordTemplateDTO[]>([]);

  const [saving, setSaving] = useState(false);

  const savingRef = useRef(false);

  const draftLoadedRef = useRef(false);

  const editDraftCheckedRef = useRef(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const audioChunksRef = useRef<Blob[]>([]);

  const recordingFormatRef = useRef(pickAudioRecordingFormat());

  const [recording, setRecording] = useState(false);

  const [studentPickerOpen, setStudentPickerOpen] = useState(false);

  const [pendingDraft, setPendingDraft] = useState<RecordEditorDraft | null>(null);

  const [draftSavedVisible, setDraftSavedVisible] = useState(false);

  const templateAppliedRef = useRef(false);



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

      setFollowUpDueAt(record.followUpDueAt ? toDateInputValue(record.followUpDueAt) : "");

      setStudentIds(record.studentIds);

      setAttachments(record.attachments.map((a) => ({ kind: a.kind, relativePath: a.relativePath, duration: a.duration })));

      if (!editDraftCheckedRef.current) {

        editDraftCheckedRef.current = true;

        const draft = loadRecordDraft("edit", recordId, record.type);

        if (draft) setPendingDraft(draft);

      }

    })();

  }, [container.records, mode, recordId]);



  useEffect(() => {

    if (mode !== "create") return;

    setTitle(`${RecordTypeConfig.configuration(initialType).titlePrefix}-${toDateInputValue(new Date())}`);

  }, [mode, initialType]);



  useEffect(() => {

    if (mode !== "create") return;

    if (draftLoadedRef.current) return;

    draftLoadedRef.current = true;

    const draft = loadRecordDraft(mode, recordId, initialType);

    if (!draft) return;

    setPendingDraft(draft);

  }, [mode, recordId, initialType]);



  useEffect(() => {

    if (!initialTemplateId || templateAppliedRef.current || templates.length === 0) return;

    const tpl = templates.find((t) => t.id === initialTemplateId);

    if (!tpl) return;

    templateAppliedRef.current = true;

    setContent(tpl.bodySkeleton);

  }, [initialTemplateId, templates]);



  const restoreDraft = () => {

    if (!pendingDraft) return;

    setTitle(pendingDraft.title);

    setHappenedAt(pendingDraft.happenedAt);

    setLocation(pendingDraft.location);

    setContent(pendingDraft.content);

    setFollowUp(pendingDraft.followUp);

    setFollowUpDueAt(pendingDraft.followUpDueAt ?? "");

    setStudentIds(pendingDraft.studentIds);

    setAttachments(pendingDraft.attachments);

    setPendingDraft(null);

  };



  const discardDraft = () => {

    clearRecordDraft(mode, recordId, type);

    setPendingDraft(null);

  };



  useEffect(() => {

    const timer = setInterval(() => {

      saveRecordDraft(mode, recordId, type, {

        title,

        happenedAt,

        location,

        content,

        followUp,

        followUpDueAt,

        studentIds,

        attachments,

      });

      setDraftSavedVisible(true);

    }, 3000);

    return () => clearInterval(timer);

  }, [mode, recordId, type, title, happenedAt, location, content, followUp, followUpDueAt, studentIds, attachments]);



  useEffect(() => {

    if (!draftSavedVisible) return;

    const hide = setTimeout(() => setDraftSavedVisible(false), 2000);

    return () => clearTimeout(hide);

  }, [draftSavedVisible]);



  const buildDraft = (): WorkRecordDraft => ({

    classId: container.requireClassId(),

    type,

    title,

    happenedAt: parseDateInput(happenedAt),

    location: location || undefined,

    studentIds,

    content,

    followUp: followUp || undefined,

    followUpDueAt: followUpDueAt ? parseDateInput(followUpDueAt) : undefined,

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

      trackRecordType(type);

      if (mode === "create") clearRecordDraft(mode, recordId, type);

      else if (recordId) clearRecordDraft("edit", recordId, type);

      toast.show("保存成功");

      router.replace(`/records/detail?id=${id}`);

    } catch (e) {

      toast.show(e instanceof Error ? e.message : "保存失败", true);

    } finally {

      setSaving(false);

      savingRef.current = false;

    }

  };



  const saveAsTemplate = async () => {

    if (!content.trim()) return;

    const name = window.prompt("模板名称", title);

    if (!name?.trim()) return;

    try {

      await container.templates.saveUser(type, name.trim(), content);

      const updated = await container.templates.list(type);

      setTemplates(updated);

      toast.show("模板已保存");

    } catch (e) {

      toast.show(e instanceof Error ? e.message : "保存模板失败", true);

    }

  };



  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const files = e.target.files;

    if (!files || files.length === 0) return;

    let added = 0;

    for (const file of Array.from(files)) {

      try {

        const blob = await compressImage(file);

        const path = await container.mediaStore.save(blob, "records", "jpg");

        setAttachments((prev) => [...prev, { kind: "photo", relativePath: path }]);

        added += 1;

      } catch {

        toast.show(`照片 ${file.name} 保存失败`, true);

      }

    }

    if (added > 0) toast.show(`已添加 ${added} 张照片`);

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



  const selectedStudentNames = useMemo(

    () =>

      studentIds

        .map((id) => students.find((s) => s.id === id)?.name)

        .filter(Boolean) as string[],

    [studentIds, students],

  );



  const removeAttachment = useCallback((index: number) => {

    setAttachments((prev) => prev.filter((_, i) => i !== index));

  }, []);



  return (

    <>

      <LoadingOverlay show={saving} message="保存中…" />

      <IOSNavBar

        title={mode === "create" ? "新建留痕" : "编辑留痕"}

        backHref={recordId ? `/records/detail?id=${recordId}` : "/workbench"}

        right={

          <IOSNavButton onClick={save} disabled={saving}>

            {saving ? "保存中" : "保存"}

          </IOSNavButton>

        }

      />

      {pendingDraft && (

        <div className="draft-restore-banner" role="status">

          <span>检测到未保存的草稿</span>

          <div className="draft-restore-actions">

            <button type="button" className="draft-restore-btn primary" onClick={restoreDraft}>

              恢复

            </button>

            <button type="button" className="draft-restore-btn" onClick={discardDraft}>

              丢弃

            </button>

          </div>

        </div>

      )}

      {draftSavedVisible && !pendingDraft && (

        <div className="draft-saved-hint">草稿已自动保存</div>

      )}

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

          <IOSFormSection

            title="关联学生"

            footer={studentIds.length > 0 ? `已选 ${studentIds.length} 人` : "点击选择学生"}

          >

            {students.length === 0 ? (

              <div className="ios-form-row">

                <span className="record-subtitle">请先在学生 Tab 添加名册</span>

              </div>

            ) : (

              <>

                <button type="button" className="ios-form-picker-row" onClick={() => setStudentPickerOpen(true)}>

                  <span>{studentIds.length > 0 ? `已选 ${studentIds.length} 人` : "选择学生"}</span>

                  <span className="ios-form-picker-chevron">›</span>

                </button>

                {selectedStudentNames.length > 0 && (

                  <div className="ios-form-row">

                    <span className="record-subtitle selected-students-summary">{selectedStudentNames.join("、")}</span>

                  </div>

                )}

              </>

            )}

          </IOSFormSection>

        )}



        <StudentPickerSheet

          open={studentPickerOpen}

          students={students}

          selectedIds={studentIds}

          onClose={() => setStudentPickerOpen(false)}

          onConfirm={setStudentIds}

        />



        <IOSFormSection title="模板">

          {templates.length > 0 && (

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

          )}

          <Link href="/records/templates" className="ios-action-row template-market-link">

            模板市场

          </Link>

        </IOSFormSection>



        <IOSFormSection title="内容">

          <IOSFormRow label="正文" stack>

            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="填写留痕内容…" />

          </IOSFormRow>

          {config.fields.includes("followUp") && (

            <>

              <IOSFormRow label="跟进" stack>

                <textarea value={followUp} onChange={(e) => setFollowUp(e.target.value)} placeholder="后续跟进计划…" />

              </IOSFormRow>

              <IOSFormRow label="跟进截止">

                <input type="date" value={followUpDueAt} onChange={(e) => setFollowUpDueAt(e.target.value)} />

              </IOSFormRow>

            </>

          )}

          {content.trim() && (

            <IOSActionRow onClick={saveAsTemplate}>保存为模板</IOSActionRow>

          )}

        </IOSFormSection>



        <IOSFormSection

          title="附件"

          footer={`已添加 ${attachments.length} 个附件${recording ? " · 正在录音…" : ""} · 照片支持 JPG/PNG 等常见图片格式 · 录音由麦克风实时录制`}

        >

          <IOSFileButton accept="image/*" multiple onChange={onPhotoSelected} icon={<IconCamera size={20} />}>

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

