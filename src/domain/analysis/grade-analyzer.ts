/** 成绩分析阈值配置。 */
export const GradeAnalysisConfig = {
  passScore: 60,
  criticalBand: 5,
  subjectBiasThreshold: 12,
  topPercent: 0.1,
  weakSubjectCount: 2,
};

export interface SubjectStats {
  subject: string;
  average: number;
  highest: number;
  lowest: number;
}

export interface StudentGradeInsight {
  studentNo: string;
  studentName: string;
  total: number;
  rank: number;
  biasedSubjects: string[];
}

export interface GradeInsightReport {
  subjectStats: SubjectStats[];
  students: StudentGradeInsight[];
  topStudents: string[];
  criticalStudents: string[];
  attentionStudents: string[];
  scoreDeltas: Record<string, number>;
}

export const EMPTY_GRADE_INSIGHT: GradeInsightReport = {
  subjectStats: [],
  students: [],
  topStudents: [],
  criticalStudents: [],
  attentionStudents: [],
  scoreDeltas: {},
};

import type { GradeAnalyzeRow } from "@/domain/use-cases/repositories";

/** 本地规则成绩分析（不调用外部 AI API）。 */
export const GradeAnalyzer = {
  analyze(
    rows: GradeAnalyzeRow[],
    subjectNames: string[],
    previousTotalsByStudentNo: Record<string, number> = {},
  ): GradeInsightReport {
    if (rows.length === 0 || subjectNames.length === 0) return EMPTY_GRADE_INSIGHT;

    const subjectStats: SubjectStats[] = subjectNames.map((subject) => {
      const values = rows.map((r) => r.scores[subject]).filter((v): v is number => v !== undefined);
      const average = values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
      return {
        subject,
        average,
        highest: values.length ? Math.max(...values) : 0,
        lowest: values.length ? Math.min(...values) : 0,
      };
    });

    const averageBySubject = Object.fromEntries(subjectStats.map((s) => [s.subject, s.average]));

    const ranked = rows
      .map((row) => {
        const total = subjectNames.reduce((sum, s) => sum + (row.scores[s] ?? 0), 0);
        const biased = subjectNames.filter((subject) => {
          const score = row.scores[subject];
          const avg = averageBySubject[subject];
          if (score === undefined || avg === undefined) return false;
          return Math.abs(score - avg) >= GradeAnalysisConfig.subjectBiasThreshold;
        });
        return { row, total, biased };
      })
      .sort((a, b) => b.total - a.total);

    const students: StudentGradeInsight[] = ranked.map((item, index) => ({
      studentNo: item.row.studentNo,
      studentName: item.row.studentName,
      total: item.total,
      rank: index + 1,
      biasedSubjects: item.biased,
    }));

    const topCount = Math.max(1, Math.ceil(students.length * GradeAnalysisConfig.topPercent));
    const topStudents = students.slice(0, topCount).map((s) => s.studentName);

    const pass = GradeAnalysisConfig.passScore;
    const band = GradeAnalysisConfig.criticalBand;
    const criticalStudents = students
      .filter((s) => Math.abs(s.total / subjectNames.length - pass) <= band)
      .map((s) => s.studentName);

    const attentionStudents = [
      ...new Set(
        ranked
          .filter(({ row }) => {
            const weakCount = subjectNames.filter((subject) => (row.scores[subject] ?? 100) < pass).length;
            return weakCount >= GradeAnalysisConfig.weakSubjectCount;
          })
          .map(({ row }) => row.studentName),
      ),
    ].sort();

    const scoreDeltas: Record<string, number> = {};
    for (const student of students) {
      const previous = previousTotalsByStudentNo[student.studentNo];
      if (previous !== undefined) scoreDeltas[student.studentNo] = student.total - previous;
    }

    return {
      subjectStats,
      students,
      topStudents,
      criticalStudents: [...new Set(criticalStudents)].sort(),
      attentionStudents,
      scoreDeltas,
    };
  },
};
