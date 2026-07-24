"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { StudentDTO } from "@/domain/use-cases/repositories";
import { IOSSection } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";

export default function StudentDetailPageClient() {
  const { id } = useParams<{ id: string }>();
  const container = useAppContainer();
  const toast = useToast();
  const router = useRouter();
  const [student, setStudent] = useState<StudentDTO | null>(null);
  const [totalPoints, setTotalPoints] = useState(0);
  const [tagInput, setTagInput] = useState("");

  const reload = useCallback(async () => {
    try {
      const s = await container.students.find(id);
      setStudent(s ?? null);
      if (s) setTotalPoints(await container.behavior.totalPoints(id));
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "加载失败", true);
    }
  }, [container, id, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveTags = async () => {
    if (!student) return;
    const tags = tagInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await container.students.setTags(id, tags);
      await reload();
      toast.show("标签已更新");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "更新失败", true);
    }
  };

  const updateField = async (field: Partial<StudentDTO>) => {
    if (!student) return;
    try {
      await container.students.update(
        id,
        field.name ?? student.name,
        field.studentNo ?? student.studentNo,
        field.gender ?? student.gender,
        field.parentName ?? student.parentName,
        field.parentPhone ?? student.parentPhone,
        field.note ?? student.note,
      );
      await reload();
      toast.show("已保存");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "保存失败", true);
    }
  };

  if (!student) {
    return (
      <>
        <IOSNavBar title="学生详情" backHref="/students" />
        <p style={{ padding: 16 }}>加载中…</p>
      </>
    );
  }

  return (
    <>
      <IOSNavBar title={student.name} backHref="/students" />
      <div className="page-content">
        <IOSSection title="基本信息">
          <div className="form-field"><label>姓名</label><input defaultValue={student.name} onBlur={(e) => updateField({ name: e.target.value })} /></div>
          <div className="form-field"><label>学号</label><input defaultValue={student.studentNo} onBlur={(e) => updateField({ studentNo: e.target.value })} /></div>
          <div className="form-field"><label>性别</label><input defaultValue={student.gender ?? ""} onBlur={(e) => updateField({ gender: e.target.value })} /></div>
          <div className="form-field"><label>家长姓名</label><input defaultValue={student.parentName ?? ""} onBlur={(e) => updateField({ parentName: e.target.value })} /></div>
          <div className="form-field"><label>家长电话</label><input defaultValue={student.parentPhone ?? ""} onBlur={(e) => updateField({ parentPhone: e.target.value })} /></div>
          <div className="form-field"><label>备注</label><textarea defaultValue={student.note ?? ""} onBlur={(e) => updateField({ note: e.target.value })} /></div>
        </IOSSection>
        <IOSSection title="标签评价">
          <div className="tag-list" style={{ padding: "0 16px 8px" }}>
            {student.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
          <div className="form-field">
            <input placeholder="输入标签，逗号分隔" value={tagInput || student.tags.join("，")} onChange={(e) => setTagInput(e.target.value)} />
            <button type="button" className="btn-secondary" style={{ marginTop: 8 }} onClick={saveTags}>
              保存标签
            </button>
          </div>
        </IOSSection>
        <IOSSection title="快捷入口">
          <Link href={`/students/attendance/${id}`} className="ios-row has-chevron">
            考勤登记
          </Link>
          <Link href={`/students/behavior/${id}`} className="ios-row has-chevron">
            奖惩积分（当前 {totalPoints} 分）
          </Link>
          <Link href={`/records?studentId=${id}`} className="ios-row has-chevron">
            关联留痕
          </Link>
        </IOSSection>
        <button
          type="button"
          className="btn-primary"
          style={{ background: "#ff3b30" }}
          onClick={async () => {
            if (!confirm("确定删除该学生？")) return;
            toast.show("请在名册中保留学生数据；当前版本不支持删除", true);
            router.push("/students");
          }}
        >
          删除学生
        </button>
      </div>
    </>
  );
}
