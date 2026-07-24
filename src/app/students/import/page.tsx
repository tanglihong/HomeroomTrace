"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { StudentCSVParser } from "@/domain/import/student-csv-parser";
import { CsvImportPanel } from "@/features/common/csv-import-panel";
import { ImportPreview } from "@/features/common/import-preview";
import { LoadingOverlay } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";
import { useSavingAction } from "@/lib/hooks";
import { STUDENT_CSV_HEADER, STUDENT_CSV_TEMPLATE } from "@/lib/import-templates";

export default function StudentImportPage() {
  const container = useAppContainer();
  const { refreshStudents } = useDataStore();
  const toast = useToast();
  const router = useRouter();
  const { saving, runSaving, savingMessage } = useSavingAction("导入中…");
  const [csv, setCsv] = useState("");
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [previewRows, setPreviewRows] = useState<string[]>([]);
  const [result, setResult] = useState<string[]>([]);

  const parsed = useMemo(() => StudentCSVParser.parse(csv), [csv]);

  const startPreview = () => {
    const { rows, errors } = parsed;
    if (errors.length > 0 && rows.length === 0) {
      toast.show(errors[0], true);
      return;
    }
    const lines = csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length === 0) {
      toast.show("请先粘贴或上传数据", true);
      return;
    }
    setPreviewRows(lines);
    setStep("preview");
  };

  const confirmImport = async () => {
    const { rows, errors } = parsed;
    try {
      await runSaving(async () => {
        const classId = container.requireClassId();
        const res = await container.students.importBatch(classId, rows);
        setResult([...errors, ...res.errors, `成功导入 ${res.imported} 人，跳过 ${res.skipped} 人`]);
        toast.show(`导入完成：${res.imported} 人`);
        if (res.imported > 0) {
          await refreshStudents(true);
          router.push("/students");
        }
      });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "导入失败", true);
    }
  };

  return (
    <>
      <LoadingOverlay show={saving} message={savingMessage} />
      <IOSNavBar
        title="导入名册"
        backHref="/students"
        right={
          step === "edit" ? (
            <button type="button" onClick={startPreview} disabled={saving}>
              预览
            </button>
          ) : null
        }
      />
      <div className="page-content">
        {step === "edit" ? (
          <CsvImportPanel
            specs={[
              "支持 Excel（.xlsx / .xls）或 CSV 文件，也可直接粘贴 CSV 文本",
              `首行必须为：${STUDENT_CSV_HEADER}`,
              "学号、姓名为必填；性别、家长信息、备注可留空",
              "重复学号将跳过，不会覆盖已有学生",
            ]}
            templateContent={STUDENT_CSV_TEMPLATE}
            csvTemplateFilename="学生名册模板.csv"
            excelTemplateFilename="学生名册模板.xlsx"
            csv={csv}
            onCsvChange={setCsv}
            disabled={saving}
          />
        ) : (
          <ImportPreview
            rows={previewRows}
            onConfirm={confirmImport}
            onCancel={() => setStep("edit")}
          />
        )}
        {result.length > 0 && (
          <div className="ios-group">
            {result.map((line, i) => (
              <div key={i} className="ios-row record-subtitle">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
