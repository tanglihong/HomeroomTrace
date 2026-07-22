import type { GradeImportRow } from "@/domain/use-cases/repositories";

/** 成绩 CSV 解析：首行 `学号,姓名,科目...`。 */
export const GradeCSVParser = {
  parse(csv: string): { subjects: string[]; rows: GradeImportRow[]; errors: string[] } {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const header = lines[0];
    if (!header) return { subjects: [], rows: [], errors: ["内容为空"] };
    const columns = header.split(",").map((c) => c.trim());
    if (columns.length < 3 || columns[0] !== "学号" || columns[1] !== "姓名") {
      return { subjects: [], rows: [], errors: ["首行格式应为：学号,姓名,科目..."] };
    }
    const subjects = columns.slice(2);
    const rows: GradeImportRow[] = [];
    const errors: string[] = [];
    lines.slice(1).forEach((line, index) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2) {
        errors.push(`第 ${index + 2} 行字段不足`);
        return;
      }
      const scores: Record<string, number> = {};
      subjects.forEach((subject, offset) => {
        const valueIndex = offset + 2;
        if (valueIndex < parts.length) {
          const value = Number(parts[valueIndex]);
          if (!Number.isNaN(value)) scores[subject] = value;
        }
      });
      rows.push({ studentNo: parts[0], studentName: parts[1], scores });
    });
    return { subjects, rows, errors };
  },
};
