"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GradeCSVParser } from "@/domain/import/grade-csv-parser";
import { CsvImportPanel } from "@/features/common/csv-import-panel";
import { ImportPreview } from "@/features/common/import-preview";
import { LoadingOverlay } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";
import { toDateInputValue } from "@/lib/format";
import { useSavingAction } from "@/lib/hooks";
import { GRADE_CSV_HEADER, GRADE_CSV_TEMPLATE } from "@/lib/import-templates";

export default function GradeImportPage() {
  const container = useAppContainer();
  const { refreshGradeSheets } = useDataStore();
  const toast = useToast();
  const router = useRouter();
  const { saving, runSaving, savingMessage } = useSavingAction("导入中…");
  const [csv, setCsv] = useState("");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState(toDateInputValue(new Date()));
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [previewRows, setPreviewRows] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  const parsed = useMemo(() => GradeCSVParser.parse(csv), [csv]);

  const startPreview = () => {
    const { rows, errors } = parsed;
    if (errors.length > 0 && rows.length === 0) {
      toast.show(errors[0], true);
      return;
    }
    if (!examName.trim()) {
      toast.show("请填写考试名称", true);
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
    const { subjects, rows, errors } = parsed;
    try {
      await runSaving(async () => {
        const classId = container.requireClassId();
        const result = await container.grades.importSheet(classId, examName, new Date(`${examDate}T12:00:00`), subjects, rows);
        setWarnings([...errors, ...result.warnings, `成功导入 ${result.importedCount} 人`]);
        toast.show("导入完成");
        await refreshGradeSheets(true);
        router.push(`/grades/insight?id=${result.sheetId}`);
      });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "导入失败", true);
    }
  };

  return (
    <>
      <LoadingOverlay show={saving} message={savingMessage} />
      <IOSNavBar
        title="导入成绩"
        backHref="/grades"
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
          <>
            <div className="form-field"><label>考试名称</label><input value={examName} onChange={(e) => setExamName(e.target.value)} disabled={saving} /></div>
            <div className="form-field"><label>考试日期</label><input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} disabled={saving} /></div>
            <CsvImportPanel
              specs={[
                "支持 Excel（.xlsx / .xls）或 CSV 文件，也可直接粘贴 CSV 文本",
                `首行必须为：${GRADE_CSV_HEADER}（科目列名可自定义）`,
                "学号、姓名为必填；成绩为空或非数字的科目将忽略",
                "学号需与名册一致，未匹配学号会给出警告",
              ]}
              templateContent={GRADE_CSV_TEMPLATE}
              csvTemplateFilename="成绩导入模板.csv"
              excelTemplateFilename="成绩导入模板.xlsx"
              csv={csv}
              onCsvChange={setCsv}
              disabled={saving}
            />
          </>
        ) : (
          <ImportPreview
            rows={previewRows}
            onConfirm={confirmImport}
            onCancel={() => setStep("edit")}
          />
        )}
        {warnings.length > 0 && (
          <div className="ios-group">
            {warnings.map((w, i) => (
              <div key={i} className="ios-row record-subtitle">{w}</div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
