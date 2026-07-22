"use client";
export function generateStaticParams() { return []; }
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecordTypeConfig } from "@/domain/models/work-record-type";
import type { StudentDTO, WorkRecordDTO } from "@/domain/use-cases/repositories";
import { IOSButton } from "@/features/common/ios-form";
import { IOSSection } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { formatRecordDate } from "@/lib/format";

function AttachmentPreview({ path, kind }: { path: string; kind: "photo" | "audio" }) {
  const container = useAppContainer();
  const [url, setUrl] = useState<string>();

  useEffect(() => {
    let objectUrl: string | undefined;
    (async () => {
      try {
        objectUrl = await container.mediaStore.url(path);
        setUrl(objectUrl);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [container, path]);

  if (!url) return <p className="record-subtitle">加载附件…</p>;
  if (kind === "photo") {
    return (
      <div className="media-preview">
        <img src={url} alt="照片附件" />
      </div>
    );
  }
  return <audio className="audio-player" controls src={url} />;
}

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const container = useAppContainer();
  const toast = useToast();
  const router = useRouter();
  const [record, setRecord] = useState<WorkRecordDTO | null>(null);
  const [students, setStudents] = useState<StudentDTO[]>([]);

  const reload = useCallback(async () => {
    try {
      const r = await container.records.find(id);
      setRecord(r ?? null);
      if (r) {
        const classId = container.requireClassId();
        const all = await container.students.list(classId);
        setStudents(all.filter((s) => r.studentIds.includes(s.id)));
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "加载失败", true);
    }
  }, [container, id, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const onDelete = async () => {
    if (!confirm("确定删除这条留痕？")) return;
    try {
      await container.records.delete(id);
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

  return (
    <>
      <IOSNavBar
        title="留痕详情"
        backHref="/records"
        right={<Link href={`/records/${id}/edit`}>编辑</Link>}
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
          </IOSSection>
        )}
        {record.attachments.length > 0 && (
          <IOSSection title="附件">
            {record.attachments.map((a) => (
              <div key={a.id} className="ios-row">
                <AttachmentPreview path={a.relativePath} kind={a.kind} />
              </div>
            ))}
          </IOSSection>
        )}
        <IOSButton variant="destructive" fullWidth onClick={onDelete}>
          删除留痕
        </IOSButton>
      </div>
    </>
  );
}
