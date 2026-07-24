"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RecordTypeConfig } from "@/domain/models/work-record-type";
import type { StudentDTO, WorkRecordDTO } from "@/domain/use-cases/repositories";
import { AttachmentPreview } from "@/features/records/attachment-preview";
import { PhotoLightbox } from "@/features/records/photo-lightbox";
import { IOSButton } from "@/features/common/ios-form";
import { IOSSection } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useIOSAlert } from "@/features/common/ios-alert";
import { showUndoToast } from "@/features/common/undo-toast";
import { useDataStore } from "@/lib/data-store";
import { useAppContainer } from "@/lib/app-container";
import { formatRecordDate } from "@/lib/format";
import { cancelPendingDelete, schedulePendingDelete } from "@/lib/pending-delete";

interface RecordDetailPageClientProps {
  recordId: string;
}

export default function RecordDetailPageClient({ recordId }: RecordDetailPageClientProps) {
  const container = useAppContainer();
  const { students: cachedStudents, removeRecord, upsertRecord } = useDataStore();
  const toast = useToast();
  const { confirm } = useIOSAlert();
  const router = useRouter();
  const [record, setRecord] = useState<WorkRecordDTO | null>(null);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [photoViewerIndex, setPhotoViewerIndex] = useState<number | null>(null);

  const reload = useCallback(async () => {
    try {
      const r = await container.records.find(recordId);
      setRecord(r ?? null);
      if (!r) {
        setStudents([]);
        return;
      }
      if (cachedStudents) {
        setStudents(cachedStudents.filter((s) => r.studentIds.includes(s.id)));
        return;
      }
      const classId = container.requireClassId();
      const all = await container.students.list(classId);
      setStudents(all.filter((s) => r.studentIds.includes(s.id)));
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "加载失败", true);
    }
  }, [container, recordId, cachedStudents, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onDelete = async () => {
    const ok = await confirm({
      title: "确定删除这条留痕？",
      message: "删除后可在 5 秒内撤销",
      confirmLabel: "删除",
      destructive: true,
    });
    if (!ok) return;
    try {
      const current = await container.records.find(recordId);
      if (!current) return;
      removeRecord(recordId);
      schedulePendingDelete(
        recordId,
        () => {
          void container.records.delete(recordId);
        },
        () => {
          void container.records.restore(current).then(() => {
            upsertRecord(current);
          });
        },
      );
      showUndoToast(toast, "已删除", () => {
        cancelPendingDelete(recordId);
      });
      router.push("/records");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "删除失败", true);
    }
  };

  if (!record) {
    return (
      <>
        <IOSNavBar title="留痕详情" backHref="/records" />
        <p style={{ padding: 16, color: "#8e8e93" }}>加载中或未找到…</p>
      </>
    );
  }

  const typeName = RecordTypeConfig.configuration(record.type).displayName;
  const photoAttachments = record.attachments.filter((attachment) => attachment.kind === "photo");
  const photoIndexByPath = new Map(photoAttachments.map((attachment, index) => [attachment.relativePath, index]));

  return (
    <>
      <IOSNavBar
        title="留痕详情"
        backHref="/records"
        right={<Link href={`/records/edit?id=${recordId}`}>编辑</Link>}
      />
      <div className="page-content">
        <IOSSection>
          <div className="ios-row">
            <div style={{ fontWeight: 600, fontSize: 20 }}>{record.title}</div>
            <div className="record-subtitle">
              {typeName} · {formatRecordDate(record.happenedAt)}
            </div>
          </div>
        </IOSSection>
        {record.location && (
          <IOSSection title="地点">
            <div className="ios-row">{record.location}</div>
          </IOSSection>
        )}
        {students.length > 0 && (
          <IOSSection title="关联学生">
            <div className="ios-row">{students.map((s) => s.name).join("、")}</div>
          </IOSSection>
        )}
        <IOSSection title="正文">
          <div className="ios-row" style={{ whiteSpace: "pre-wrap" }}>
            {record.content}
          </div>
        </IOSSection>
        {record.followUp && (
          <IOSSection title="跟进">
            <div className="ios-row" style={{ whiteSpace: "pre-wrap" }}>
              {record.followUp}
            </div>
            {record.followUpDueAt && (
              <div className="ios-row record-subtitle">
                截止日期：{formatRecordDate(record.followUpDueAt)}
              </div>
            )}
          </IOSSection>
        )}
        {!record.followUp && record.followUpDueAt && (
          <IOSSection title="跟进截止">
            <div className="ios-row">{formatRecordDate(record.followUpDueAt)}</div>
          </IOSSection>
        )}
        {record.attachments.length > 0 && (
          <IOSSection title="附件">
            {record.attachments.map((a) => (
              <div key={a.id} className="ios-row">
                <AttachmentPreview
                  path={a.relativePath}
                  kind={a.kind}
                  viewable={a.kind === "photo"}
                  onView={
                    a.kind === "photo"
                      ? () => setPhotoViewerIndex(photoIndexByPath.get(a.relativePath) ?? 0)
                      : undefined
                  }
                />
              </div>
            ))}
          </IOSSection>
        )}
        <IOSButton variant="destructive" fullWidth onClick={onDelete}>
          删除留痕
        </IOSButton>
      </div>
      {photoViewerIndex !== null && photoAttachments.length > 0 && (
        <PhotoLightbox
          paths={photoAttachments.map((attachment) => attachment.relativePath)}
          initialIndex={photoViewerIndex}
          onClose={() => setPhotoViewerIndex(null)}
        />
      )}
    </>
  );
}
