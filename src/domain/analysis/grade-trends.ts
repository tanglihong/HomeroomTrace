import type { GradeAnalyzeRow, GradeSheetDTO } from "@/domain/use-cases/repositories";

export interface ExamTrendPoint {
  sheetId: string;
  examName: string;
  examDate: Date;
  classAverage: number;
  subjectAverages: Record<string, number>;
}

export interface StudentTrendSeries {
  studentNo: string;
  studentName: string;
  points: { examName: string; total: number }[];
}

/** 跨多次考试计算班级均分趋势 */
export function buildClassExamTrends(
  sheets: GradeSheetDTO[],
  entriesBySheet: Map<string, GradeAnalyzeRow[]>,
): ExamTrendPoint[] {
  return [...sheets]
    .sort((a, b) => a.examDate.getTime() - b.examDate.getTime())
    .map((sheet) => {
      const rows = entriesBySheet.get(sheet.id) ?? [];
      const subjectAverages: Record<string, number> = {};
      for (const subject of sheet.subjectNames) {
        const values = rows.map((r) => r.scores[subject]).filter((v): v is number => v !== undefined);
        subjectAverages[subject] = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
      }
      const classAverage =
        rows.length === 0
          ? 0
          : rows.reduce((sum, row) => {
              const total = sheet.subjectNames.reduce((s, sub) => s + (row.scores[sub] ?? 0), 0);
              return sum + total / sheet.subjectNames.length;
            }, 0) / rows.length;
      return {
        sheetId: sheet.id,
        examName: sheet.examName,
        examDate: sheet.examDate,
        classAverage,
        subjectAverages,
      };
    });
}

/** 学生总分跨考趋势（前 8 名或指定学号） */
export function buildStudentTrends(
  sheets: GradeSheetDTO[],
  entriesBySheet: Map<string, GradeAnalyzeRow[]>,
  studentNos?: string[],
): StudentTrendSeries[] {
  const sorted = [...sheets].sort((a, b) => a.examDate.getTime() - b.examDate.getTime());
  const latest = entriesBySheet.get(sorted[sorted.length - 1]?.id ?? "") ?? [];
  const targets =
    studentNos ??
    latest
      .map((r) => ({
        studentNo: r.studentNo,
        total: sorted[sorted.length - 1].subjectNames.reduce((s, sub) => s + (r.scores[sub] ?? 0), 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((x) => x.studentNo);

  return targets.map((studentNo) => {
    const first = latest.find((r) => r.studentNo === studentNo);
    const points = sorted.map((sheet) => {
      const row = (entriesBySheet.get(sheet.id) ?? []).find((r) => r.studentNo === studentNo);
      const total = row ? sheet.subjectNames.reduce((s, sub) => s + (row.scores[sub] ?? 0), 0) : 0;
      return { examName: sheet.examName, total };
    });
    return { studentNo, studentName: first?.studentName ?? studentNo, points };
  });
}

/** 偏科雷达图数据：学生各科与班级均差 */
export function buildBiasRadar(
  rows: GradeAnalyzeRow[],
  subjectNames: string[],
  subjectAverages: Record<string, number>,
  studentNo: string,
): { subject: string; score: number; classAvg: number }[] {
  const row = rows.find((r) => r.studentNo === studentNo);
  if (!row) return [];
  return subjectNames.map((subject) => ({
    subject,
    score: row.scores[subject] ?? 0,
    classAvg: subjectAverages[subject] ?? 0,
  }));
}
