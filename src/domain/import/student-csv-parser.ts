import type { StudentImportRow } from "@/domain/use-cases/repositories";

function nilIfBlank(value: string): string | undefined {
  const t = value.trim();
  return t.length === 0 ? undefined : t;
}

/** 学生名册 CSV 解析：首行 `学号,姓名,性别,家长姓名,家长电话,备注`。 */
export const StudentCSVParser = {
  parse(csv: string): { rows: StudentImportRow[]; errors: string[] } {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const header = lines[0];
    if (!header) return { rows: [], errors: ["内容为空"] };
    const columns = header.split(",").map((c) => c.trim());
    if (columns.length < 2 || columns[0] !== "学号" || columns[1] !== "姓名") {
      return { rows: [], errors: ["首行格式应为：学号,姓名,性别,家长姓名,家长电话,备注"] };
    }
    const rows: StudentImportRow[] = [];
    const errors: string[] = [];
    lines.slice(1).forEach((line, index) => {
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length < 2 || !parts[0] || !parts[1]) {
        errors.push(`第 ${index + 2} 行：学号或姓名为空`);
        return;
      }
      rows.push({
        studentNo: parts[0],
        name: parts[1],
        gender: parts.length > 2 ? nilIfBlank(parts[2]) : undefined,
        parentName: parts.length > 3 ? nilIfBlank(parts[3]) : undefined,
        parentPhone: parts.length > 4 ? nilIfBlank(parts[4]) : undefined,
        note: parts.length > 5 ? nilIfBlank(parts[5]) : undefined,
      });
    });
    return { rows, errors };
  },
};
