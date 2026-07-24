"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GradeCSVParser } from "@/domain/import/grade-csv-parser";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";
import { toDateInputValue } from "@/lib/format";

export default function GradeImportPage() {
  const container = useAppContainer();
  const { refreshGradeSheets } = useDataStore();
  const toast = useToast();
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [examName, setExamName] = useState("");
  const [examDate, setExamDate] = useState(toDateInputValue(new Date()));
  const [warnings, setWarnings] = useState<string[]>([]);

  const importCsv = async () => {
    const { subjects, rows, errors } = GradeCSVParser.parse(csv);
    if (errors.length > 0 && rows.length === 0) {
      toast.show(errors[0], true);
      return;
    }
    if (!examName.trim()) {
      toast.show("请填写考试名称", true);
      return;
    }
    try {
      const classId = container.requireClassId();
      const result = await container.grades.importSheet(classId, examName, new Date(`${examDate}T12:00:00`), subjects, rows);
      setWarnings([...errors, ...result.warnings, `成功导入 ${result.importedCount} 人`]);
      toast.show("导入完成");
      await refreshGradeSheets(true);
      router.push(`/grades/insight/${result.sheetId}`);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "导入失败", true);
    }
  };

  return (
    <>
      <IOSNavBar title="导入成绩" backHref="/grades" right={<button type="button" onClick={importCsv}>导入</button>} />
      <div className="page-content">
        <p style={{ padding: "0 16px", color: "#8e8e93", fontSize: 14 }}>CSV 首行：学号,姓名,语文,数学,…</p>
        <div className="form-field"><label>考试名称</label><input value={examName} onChange={(e) => setExamName(e.target.value)} /></div>
        <div className="form-field"><label>考试日期</label><input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} /></div>
        <div className="form-field">
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} placeholder="粘贴 CSV…" style={{ minHeight: 200 }} />
        </div>
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
