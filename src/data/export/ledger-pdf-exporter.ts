import { PrivacyRedactor } from "@/domain/privacy/privacy-redactor";

export interface LedgerPDFItem {
  title: string;
  typeName: string;
  happenedAt: Date;
  content: string;
  followUp?: string;
  studentNames: string[];
  attachmentNames: string[];
  parentPhones: string[];
}

/** 工作台账 PDF 导出（jsPDF）。 */
export async function exportLedgerPDF(title: string, items: LedgerPDFItem[], redactPhone: boolean): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const formatter = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const ensureSpace = (needed: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const draw = (text: string, fontSize: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    const lineHeight = fontSize * 1.4;
    ensureSpace(lines.length * lineHeight + 8);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight + 8;
  };

  draw(title, 18, true);
  draw(`共 ${items.length} 条`, 12);

  for (const item of items) {
    ensureSpace(80);
    draw(`【${item.typeName}】${item.title}`, 14, true);
    draw(`时间：${formatter.format(item.happenedAt)}`, 11);
    if (item.studentNames.length > 0) draw(`学生：${item.studentNames.join("、")}`, 11);
    let body = item.content;
    if (redactPhone) body = PrivacyRedactor.maskPhonesInText(body);
    draw(body, 11);
    if (item.followUp?.trim()) {
      let text = `跟进：${item.followUp}`;
      if (redactPhone) text = PrivacyRedactor.maskPhonesInText(text);
      draw(text, 11);
    }
    if (item.attachmentNames.length > 0) draw(`附件：${item.attachmentNames.join("、")}`, 11);
    if (redactPhone) {
      for (const phone of item.parentPhones) {
        const masked = PrivacyRedactor.maskPhone(phone);
        if (masked) draw(`家长电话：${masked}`, 10);
      }
    }
    y += 10;
  }

  return doc.output("blob");
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
