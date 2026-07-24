import { RecordTypeConfig, type WorkRecordType } from "@/domain/models/work-record-type";
import type { WorkRecordDTO } from "@/domain/use-cases/repositories";
import { downloadBlob } from "@/data/export/ledger-pdf-exporter";
import type { CompetencyChecklistItem } from "@/domain/checklist/competency-checklist";
import type { WorkbenchStats } from "@/domain/stats/workbench-stats";
import { formatRecordDate } from "@/lib/format";

const HTML_DOC_TYPE = "application/msword";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlDocument(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: "Microsoft YaHei", SimSun, sans-serif; line-height: 1.6; color: #111; }
    h1, h2 { margin: 0 0 12px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0 24px; }
    th, td { border: 1px solid #999; padding: 8px; text-align: left; vertical-align: top; }
    th { background: #f2f2f2; }
    .meta { color: #666; margin-bottom: 16px; }
    .record-block { margin-bottom: 20px; page-break-inside: avoid; }
    .record-title { font-weight: bold; margin-bottom: 6px; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}

function checklistRows(items: CompetencyChecklistItem[]): string {
  return items
    .map(
      (item) =>
        `<tr>
          <td>${escapeHtml(item.displayName)}</td>
          <td>${item.count}</td>
          <td>${item.required}</td>
          <td>${item.done ? "已完成" : "未完成"}</td>
        </tr>`,
    )
    .join("");
}

function statsRows(stats: WorkbenchStats): string {
  return `<tr><td>本周留痕</td><td>${stats.weekCount}</td></tr>
<tr><td>本月留痕</td><td>${stats.monthCount}</td></tr>
<tr><td>待跟进</td><td>${stats.dueFollowUps}</td></tr>
<tr><td>未覆盖学生</td><td>${stats.uncoveredStudents}</td></tr>`;
}

/** 导出学期工作摘要 HTML（可用 Word 打开）。 */
export function exportSemesterSummaryHtml(
  title: string,
  stats: WorkbenchStats,
  checklist: CompetencyChecklistItem[],
): Blob {
  const generatedAt = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());

  const body = `
<h1>${escapeHtml(title)}</h1>
<p class="meta">生成时间：${escapeHtml(generatedAt)}</p>
<h2>工作概览</h2>
<table>
  <thead><tr><th>指标</th><th>数值</th></tr></thead>
  <tbody>${statsRows(stats)}</tbody>
</table>
<h2>能力项检查清单</h2>
<table>
  <thead><tr><th>能力项</th><th>已完成</th><th>要求</th><th>状态</th></tr></thead>
  <tbody>${checklistRows(checklist)}</tbody>
</table>`;

  return new Blob(["\uFEFF", htmlDocument(title, body)], { type: HTML_DOC_TYPE });
}

function renderRecordBlock(record: WorkRecordDTO): string {
  const typeName = RecordTypeConfig.configuration(record.type).displayName;
  const lines = [
    `<div class="record-block">`,
    `<div class="record-title">【${escapeHtml(typeName)}】${escapeHtml(record.title)}</div>`,
    `<div>时间：${escapeHtml(formatRecordDate(record.happenedAt))}</div>`,
  ];
  if (record.location?.trim()) {
    lines.push(`<div>地点：${escapeHtml(record.location)}</div>`);
  }
  lines.push(`<div>${escapeHtml(record.content).replace(/\n/g, "<br />")}</div>`);
  if (record.followUp?.trim()) {
    lines.push(`<div>跟进：${escapeHtml(record.followUp).replace(/\n/g, "<br />")}</div>`);
  }
  lines.push(`</div>`);
  return lines.join("");
}

/** 按留痕类型分组导出 HTML 台账。 */
export function exportGroupedRecordsHtml(grouped: Partial<Record<WorkRecordType, WorkRecordDTO[]>>): Blob {
  const sections = (Object.keys(grouped) as WorkRecordType[])
    .filter((type) => (grouped[type]?.length ?? 0) > 0)
    .map((type) => {
      const records = grouped[type] ?? [];
      const typeName = RecordTypeConfig.configuration(type).displayName;
      const blocks = records.map(renderRecordBlock).join("");
      return `<h2>${escapeHtml(typeName)}（${records.length} 条）</h2>${blocks}`;
    })
    .join("");

  const title = "班主任工作留痕台账";
  const body = `<h1>${title}</h1>${sections || "<p>暂无留痕记录</p>"}`;
  return new Blob(["\uFEFF", htmlDocument(title, body)], { type: HTML_DOC_TYPE });
}

/** 下载 HTML 为 Word 兼容文档。 */
export function downloadHtmlAsDoc(blob: Blob, filename: string): void {
  const name = filename.endsWith(".doc") ? filename : `${filename}.doc`;
  downloadBlob(blob, name);
}
