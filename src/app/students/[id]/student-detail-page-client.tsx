"use client";



import Link from "next/link";

import { useCallback, useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import type { ParentCommunicationChannel, ParentCommunicationDTO, StudentDTO } from "@/domain/use-cases/repositories";

import { IOSSection, LoadingOverlay } from "@/features/common/ios-list";

import { IOSNavBar } from "@/features/common/ios-nav-bar";

import { useToast } from "@/features/common/toast";

import { useIOSAlert } from "@/features/common/ios-alert";

import { StudentTimeline } from "@/features/students/student-timeline";

import { TagPicker } from "@/features/students/tag-picker";

import { useAppContainer } from "@/lib/app-container";

import { useDataStore } from "@/lib/data-store";

import { formatRecordDate } from "@/lib/format";

import { downloadExcelTemplate, STUDENT_CSV_HEADER } from "@/lib/import-templates";

import { useSavingAction } from "@/lib/hooks";



const CHANNEL_LABELS: Record<ParentCommunicationChannel, string> = {

  phone: "电话",

  wechat: "微信",

  sms: "短信",

  other: "其他",

};



interface StudentDetailPageClientProps {

  studentId: string;

}



function studentToCsvRow(student: StudentDTO): string {

  return [student.studentNo, student.name, student.gender ?? "", student.parentName ?? "", student.parentPhone ?? "", student.note ?? ""].join(",");

}



export default function StudentDetailPageClient({ studentId: id }: StudentDetailPageClientProps) {

  const container = useAppContainer();

  const { refreshStudents } = useDataStore();

  const toast = useToast();

  const { confirm } = useIOSAlert();

  const router = useRouter();

  const { saving, runSaving, savingMessage } = useSavingAction();

  const [student, setStudent] = useState<StudentDTO | null>(null);

  const [totalPoints, setTotalPoints] = useState(0);

  const [tags, setTags] = useState<string[]>([]);

  const [comms, setComms] = useState<ParentCommunicationDTO[]>([]);

  const [commChannel, setCommChannel] = useState<ParentCommunicationChannel>("phone");

  const [commSummary, setCommSummary] = useState("");



  const reload = useCallback(async () => {

    try {

      const s = await container.students.find(id);

      setStudent(s ?? null);

      if (s) {

        setTags(s.tags);

        setTotalPoints(await container.behavior.totalPoints(id));

        setComms(await container.parentCommunications.list(id));

      }

    } catch (e) {

      toast.show(e instanceof Error ? e.message : "加载失败", true);

    }

  }, [container, id, toast]);



  useEffect(() => {

    reload();

  }, [reload]);



  const saveTags = async (nextTags: string[]) => {

    if (!student) return;

    try {

      await runSaving(async () => {

        await container.students.setTags(id, nextTags);

        setTags(nextTags);

        toast.show("标签已更新");

      });

    } catch (e) {

      toast.show(e instanceof Error ? e.message : "更新失败", true);

    }

  };



  const updateField = async (field: Partial<StudentDTO>) => {

    if (!student) return;

    try {

      await runSaving(async () => {

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

      });

    } catch (e) {

      toast.show(e instanceof Error ? e.message : "保存失败", true);

    }

  };



  const checkStudentNo = async (studentNo: string) => {

    if (!student || studentNo === student.studentNo) return;

    const taken = await container.students.isStudentNoTaken(student.classId, studentNo, id);

    if (taken) {

      toast.show("学号已被占用", true);

      return;

    }

    await updateField({ studentNo });

  };



  const addCommunication = async () => {

    if (!commSummary.trim()) {

      toast.show("请填写沟通摘要", true);

      return;

    }

    try {

      await runSaving(async () => {

        await container.parentCommunications.add(id, new Date(), commChannel, commSummary.trim());

        setCommSummary("");

        await reload();

        toast.show("已记录");

      });

    } catch (e) {

      toast.show(e instanceof Error ? e.message : "保存失败", true);

    }

  };



  const exportRoster = async () => {

    if (!student) return;

    const template = `${STUDENT_CSV_HEADER}\n${studentToCsvRow(student)}`;

    await downloadExcelTemplate(template, `${student.name}-名册.xlsx`);

    toast.show("名册已导出");

  };



  const archiveStudent = async () => {

    const ok = await confirm({

      title: "归档该学生？",

      message: "归档后将从活跃名册中隐藏，数据仍保留",

      confirmLabel: "归档",

      destructive: true,

    });

    if (!ok) return;

    try {

      await runSaving(async () => {

        await container.students.archive(id);

        await refreshStudents(true);

        toast.show("已归档");

        router.push("/students");

      });

    } catch (e) {

      toast.show(e instanceof Error ? e.message : "归档失败", true);

    }

  };



  const deleteStudent = async () => {

    const ok = await confirm({

      title: "确定删除该学生？",

      message: "删除后无法恢复",

      confirmLabel: "删除",

      destructive: true,

    });

    if (!ok) return;

    try {

      await runSaving(async () => {

        await container.students.delete(id);

        await refreshStudents(true);

        toast.show("已删除");

        router.push("/students");

      });

    } catch (e) {

      toast.show(e instanceof Error ? e.message : "删除失败", true);

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

      <LoadingOverlay show={saving} message={savingMessage} />

      <IOSNavBar title={student.name} backHref="/students" />

      <div className="page-content">

        <IOSSection title="基本信息">

          <div className="form-field"><label>姓名</label><input defaultValue={student.name} onBlur={(e) => updateField({ name: e.target.value })} disabled={saving} /></div>

          <div className="form-field"><label>学号</label><input defaultValue={student.studentNo} onBlur={(e) => void checkStudentNo(e.target.value)} disabled={saving} /></div>

          <div className="form-field"><label>性别</label><input defaultValue={student.gender ?? ""} onBlur={(e) => updateField({ gender: e.target.value })} disabled={saving} /></div>

          <div className="form-field"><label>家长姓名</label><input defaultValue={student.parentName ?? ""} onBlur={(e) => updateField({ parentName: e.target.value })} disabled={saving} /></div>

          <div className="form-field"><label>家长电话</label><input defaultValue={student.parentPhone ?? ""} onBlur={(e) => updateField({ parentPhone: e.target.value })} disabled={saving} /></div>

          <div className="form-field"><label>备注</label><textarea defaultValue={student.note ?? ""} onBlur={(e) => updateField({ note: e.target.value })} disabled={saving} /></div>

        </IOSSection>

        <IOSSection title="标签评价">

          <div style={{ padding: "0 16px 12px" }}>

            <TagPicker value={tags} onChange={(next) => void saveTags(next)} disabled={saving} />

          </div>

        </IOSSection>

        <IOSSection title="动态时间线">

          <StudentTimeline studentId={id} />

        </IOSSection>

        <IOSSection title="家校沟通">

          {comms.length === 0 ? (

            <div className="ios-row record-subtitle">暂无沟通记录</div>

          ) : (

            comms.map((c) => (

              <div key={c.id} className="ios-row">

                <div>{formatRecordDate(c.date)} · {CHANNEL_LABELS[c.channel]}</div>

                <div className="record-subtitle">{c.summary}</div>

              </div>

            ))

          )}

          <div className="form-field">

            <label>渠道</label>

            <select value={commChannel} onChange={(e) => setCommChannel(e.target.value as ParentCommunicationChannel)} disabled={saving}>

              {(Object.keys(CHANNEL_LABELS) as ParentCommunicationChannel[]).map((ch) => (

                <option key={ch} value={ch}>{CHANNEL_LABELS[ch]}</option>

              ))}

            </select>

          </div>

          <div className="form-field">

            <label>摘要</label>

            <input value={commSummary} onChange={(e) => setCommSummary(e.target.value)} placeholder="沟通内容摘要" disabled={saving} />

          </div>

          <button type="button" className="btn-secondary" style={{ margin: "0 16px 12px" }} onClick={addCommunication} disabled={saving}>

            添加沟通记录

          </button>

        </IOSSection>

        <IOSSection title="快捷入口">

          <Link href={`/students/behavior?id=${id}`} className="ios-row has-chevron">

            奖惩积分（当前 {totalPoints} 分）

          </Link>

          <Link href={`/records?studentId=${id}`} className="ios-row has-chevron">

            关联留痕

          </Link>

          <button type="button" className="ios-row" style={{ width: "100%", textAlign: "left" }} onClick={() => void exportRoster()} disabled={saving}>

            导出名册 Excel

          </button>

        </IOSSection>

        <button

          type="button"

          className="btn-secondary"

          style={{ marginBottom: 12 }}

          disabled={saving}

          onClick={archiveStudent}

        >

          归档学生

        </button>

        <button

          type="button"

          className="btn-primary"

          style={{ background: "#ff3b30" }}

          disabled={saving}

          onClick={deleteStudent}

        >

          删除学生

        </button>

      </div>

    </>

  );

}

