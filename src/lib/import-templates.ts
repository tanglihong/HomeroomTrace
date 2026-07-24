import { downloadBlob } from "@/data/export/ledger-pdf-exporter";

/** 学生名册 CSV 表头 */
export const STUDENT_CSV_HEADER = "学号,姓名,性别,家长姓名,家长电话,备注";

/** 成绩 CSV 表头示例（科目列可自定义） */
export const GRADE_CSV_HEADER = "学号,姓名,语文,数学,英语";

export const STUDENT_CSV_TEMPLATE = `${STUDENT_CSV_HEADER}
2024001,张三,男,张父,13800000001,
2024002,李四,女,李母,13800000002,`;

export const GRADE_CSV_TEMPLATE = `${GRADE_CSV_HEADER}
2024001,张三,92,88,95
2024002,李四,85,90,87`;

function templateToRows(template: string): string[][] {
  return template
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((cell) => cell.trim()));
}

/** 下载 CSV 模板（带 UTF-8 BOM，Excel 可直接打开） */
export function downloadCsvTemplate(content: string, filename: string): void {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, filename);
}

/** 下载 Excel 模板（.xlsx） */
export async function downloadExcelTemplate(template: string, filename: string): Promise<void> {
  const XLSX = await import("xlsx");
  const rows = templateToRows(template);
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "数据");
  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    filename,
  );
}

/** 读取 CSV / Excel 文件并转为 CSV 文本，供现有解析器使用 */
export async function readImportFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    return file.text();
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error("Excel 文件中没有工作表");
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_csv(sheet, { FS: ",", RS: "\n" }).trim();
  }
  throw new Error("不支持的文件格式，请选择 .xlsx、.xls 或 .csv 文件");
}
