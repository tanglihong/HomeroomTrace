"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { IOSButton, IOSFormRow, IOSFormSection } from "@/features/common/ios-form";
import { IOSNavBar, IOSNavButton } from "@/features/common/ios-nav-bar";
import { LoadingOverlay } from "@/features/common/ios-list";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";
import { useSavingAction } from "@/lib/hooks";

export default function StudentEditorPage() {
  const container = useAppContainer();
  const { refreshStudents } = useDataStore();
  const toast = useToast();
  const router = useRouter();
  const { saving, runSaving, savingMessage } = useSavingAction();
  const [name, setName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [gender, setGender] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [note, setNote] = useState("");

  const save = async () => {
    try {
      await runSaving(async () => {
        const classId = container.requireClassId();
        const id = await container.students.add(
          classId,
          name,
          studentNo,
          gender || undefined,
          parentName || undefined,
          parentPhone || undefined,
          note || undefined,
        );
        await refreshStudents(true);
        router.push(`/students/detail?id=${id}`);
      });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "保存失败", true);
    }
  };

  return (
    <>
      <LoadingOverlay show={saving} message={savingMessage} />
      <IOSNavBar
        title="添加学生"
        backHref="/students"
        right={
          <IOSNavButton onClick={save} disabled={saving}>
            {saving ? "保存中" : "保存"}
          </IOSNavButton>
        }
      />
      <div className="page-content">
        <IOSFormSection title="基本信息">
          <IOSFormRow label="姓名">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="必填" disabled={saving} />
          </IOSFormRow>
          <IOSFormRow label="学号">
            <input value={studentNo} onChange={(e) => setStudentNo(e.target.value)} placeholder="必填" disabled={saving} />
          </IOSFormRow>
          <IOSFormRow label="性别">
            <input value={gender} onChange={(e) => setGender(e.target.value)} placeholder="选填" disabled={saving} />
          </IOSFormRow>
        </IOSFormSection>
        <IOSFormSection title="家长信息">
          <IOSFormRow label="姓名">
            <input value={parentName} onChange={(e) => setParentName(e.target.value)} placeholder="选填" disabled={saving} />
          </IOSFormRow>
          <IOSFormRow label="电话">
            <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="选填" inputMode="tel" disabled={saving} />
          </IOSFormRow>
        </IOSFormSection>
        <IOSFormSection title="备注">
          <IOSFormRow label="备注" stack>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="选填" disabled={saving} />
          </IOSFormRow>
        </IOSFormSection>
        <IOSButton variant="filled" fullWidth onClick={save} disabled={saving}>
          {saving ? "保存中…" : "保存学生"}
        </IOSButton>
      </div>
    </>
  );
}
