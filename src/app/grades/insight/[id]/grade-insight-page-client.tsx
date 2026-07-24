"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GradeAnalyzer } from "@/domain/analysis/grade-analyzer";
import { buildBiasRadar, buildClassExamTrends, buildStudentTrends } from "@/domain/analysis/grade-trends";
import type { GradeAnalyzeRow, GradeSheetDTO } from "@/domain/use-cases/repositories";
import { GradeLineChart } from "@/features/grades/grade-line-chart";
import { GradeRadarChart } from "@/features/grades/grade-radar-chart";
import { GradeTrendChart } from "@/features/grades/grade-trend-chart";
import { IOSSection } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";

interface GradeInsightPageClientProps {
  sheetId: string;
}

export default function GradeInsightPageClient({ sheetId }: GradeInsightPageClientProps) {
  const container = useAppContainer();
  const { gradeSheets } = useDataStore();
  const toast = useToast();
  const [sheet, setSheet] = useState<GradeSheetDTO | null>(null);
  const [allSheets, setAllSheets] = useState<GradeSheetDTO[]>([]);
  const [rows, setRows] = useState<GradeAnalyzeRow[]>([]);
  const [entriesCache, setEntriesCache] = useState<Map<string, GradeAnalyzeRow[]>>(new Map());
  const [radarStudentNo, setRadarStudentNo] = useState("");
  const [report, setReport] = useState(GradeAnalyzer.analyze([], []));

  const reload = useCallback(async () => {
    try {
      const classId = container.requireClassId();
      const sheets =
        gradeSheets ?? (await container.grades.listSheets(classId));
      setAllSheets(sheets);
      const current = sheets.find((s) => s.id === sheetId) ?? null;
      setSheet(current);
      if (!current) return;

      const cache = new Map<string, GradeAnalyzeRow[]>();
      for (const s of sheets) {
        cache.set(s.id, await container.grades.entries(s.id));
      }
      setEntriesCache(cache);

      const currentRows = cache.get(sheetId) ?? [];
      setRows(currentRows);
      const previous = await container.grades.previousTotals(classId, sheetId);
      setReport(GradeAnalyzer.analyze(currentRows, current.subjectNames, previous));
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "加载失败", true);
    }
  }, [container, gradeSheets, sheetId, toast]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (rows.length > 0 && !radarStudentNo) {
      setRadarStudentNo(rows[0].studentNo);
    }
  }, [rows, radarStudentNo]);

  const classTrend = useMemo(
    () => buildClassExamTrends(allSheets, entriesCache),
    [allSheets, entriesCache],
  );

  const studentTrends = useMemo(
    () => buildStudentTrends(allSheets, entriesCache),
    [allSheets, entriesCache],
  );

  const subjectAvgs = useMemo(
    () => Object.fromEntries(report.subjectStats.map((s) => [s.subject, s.average])),
    [report.subjectStats],
  );

  const radarData = useMemo(() => {
    if (!sheet || !radarStudentNo) return [];
    return buildBiasRadar(rows, sheet.subjectNames, subjectAvgs, radarStudentNo);
  }, [rows, sheet, subjectAvgs, radarStudentNo]);

  const radarStudentName = rows.find((r) => r.studentNo === radarStudentNo)?.studentName;

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

        <IOSSection title="本次各科均分">
          <GradeTrendChart subjectStats={report.subjectStats} />
        </IOSSection>

        <IOSSection title="班级均分趋势" footer="需导入多次考试成绩">
          <GradeLineChart
            series={[
              {
                label: "班级均分",
                points: classTrend.map((p) => ({ x: p.examName, y: p.classAverage })),
              },
            ]}
          />
        </IOSSection>

        {studentTrends.length > 0 && (
          <IOSSection title="个体总分趋势（前5名）">
            <GradeLineChart
              series={studentTrends.map((s, i) => ({
                label: s.studentName,
                points: s.points.map((p) => ({ x: p.examName, y: p.total })),
                color: ["#B5838D", "#34C759", "#FF9500", "#AF52DE", "#E07373"][i],
              }))}
            />
          </IOSSection>
        )}

        <IOSSection title="偏科雷达图">
          <div className="form-field" style={{ padding: "0 16px 8px" }}>
            <select value={radarStudentNo} onChange={(e) => setRadarStudentNo(e.target.value)}>
              {rows.map((r) => (
                <option key={r.studentNo} value={r.studentNo}>
                  {r.studentName}（{r.studentNo}）
                </option>
              ))}
            </select>
          </div>
          <GradeRadarChart data={radarData} title={radarStudentName ? `${radarStudentName} 各科 vs 班均` : undefined} />
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
