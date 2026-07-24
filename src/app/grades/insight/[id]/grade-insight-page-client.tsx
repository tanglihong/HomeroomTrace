"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GradeAnalyzer } from "@/domain/analysis/grade-analyzer";
import type { GradeSheetDTO } from "@/domain/use-cases/repositories";
import { IOSSection } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";

export default function GradeInsightPageClient() {
  const { id: sheetId } = useParams<{ id: string }>();
  const container = useAppContainer();
  const toast = useToast();
  const [sheet, setSheet] = useState<GradeSheetDTO | null>(null);
  const [report, setReport] = useState(GradeAnalyzer.analyze([], []));

  const reload = useCallback(async () => {
    try {
      const classId = container.requireClassId();
      const sheets = await container.grades.listSheets(classId);
      const current = sheets.find((s) => s.id === sheetId) ?? null;
      setSheet(current);
      if (!current) return;
      const rows = await container.grades.entries(sheetId);
      const previous = await container.grades.previousTotals(classId, sheetId);
      setReport(GradeAnalyzer.analyze(rows, current.subjectNames, previous));
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "加载失败", true);
    }
  }, [container, sheetId, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (!sheet) {
    return (
      <>
        <IOSNavBar title="学情简报" backHref="/grades" />
        <p style={{ padding: 16 }}>加载中…</p>
      </>
    );
  }

  return (
    <>
      <IOSNavBar title="学情简报" backHref="/grades" />
      <div className="page-content">
        <h2 style={{ padding: "0 16px", margin: "0 0 16px" }}>{sheet.examName}</h2>
        <IOSSection title="各科统计">
          {report.subjectStats.map((s) => (
            <div key={s.subject} className="ios-row">
              <div style={{ fontWeight: 600 }}>{s.subject}</div>
              <div className="record-subtitle">
                均分 {s.average.toFixed(1)} · 最高 {s.highest} · 最低 {s.lowest}
              </div>
            </div>
          ))}
        </IOSSection>
        <IOSSection title="尖子生">
          <div className="ios-row">{report.topStudents.join("、") || "无"}</div>
        </IOSSection>
        <IOSSection title="临界生">
          <div className="ios-row">{report.criticalStudents.join("、") || "无"}</div>
        </IOSSection>
        <IOSSection title="需关注">
          <div className="ios-row">{report.attentionStudents.join("、") || "无"}</div>
        </IOSSection>
        <IOSSection title="排名（前 10）">
          {report.students.slice(0, 10).map((s) => (
            <div key={s.studentNo} className="ios-row">
              <div>
                #{s.rank} {s.studentName}（{s.total.toFixed(1)}）
              </div>
              {s.biasedSubjects.length > 0 && (
                <div className="record-subtitle">偏科：{s.biasedSubjects.join("、")}</div>
              )}
              {report.scoreDeltas[s.studentNo] !== undefined && (
                <div className="record-subtitle">
                  较上次 {report.scoreDeltas[s.studentNo] > 0 ? "+" : ""}
                  {report.scoreDeltas[s.studentNo].toFixed(1)}
                </div>
              )}
            </div>
          ))}
        </IOSSection>
      </div>
    </>
  );
}
