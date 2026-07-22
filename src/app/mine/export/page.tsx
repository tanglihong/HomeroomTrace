"use client";

import { useState } from "react";
import { RecordTypeConfig } from "@/domain/models/work-record-type";
import { exportLedgerPDF, downloadBlob } from "@/data/export/ledger-pdf-exporter";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { toDateInputValue } from "@/lib/format";

export default function ExportPage() {
  const container = useAppContainer();
  const toast = useToast();
  const [startDate, setStartDate] = useState(toDateInputValue(new Date(Date.now() - 30 * 86400000)));
  const [endDate, setEndDate] = useState(toDateInputValue(new Date()));
  const [redactPhone, setRedactPhone] = useState(true);
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const classId = container.requireClassId();
      const records = await container.records.list(classId, {
        startDate: new Date(`${startDate}T00:00:00`),
        endDate: new Date(`${endDate}T23:59:59`),
      });
      const students = await container.students.list(classId);
      const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));
      const items = records.map((r) => ({
        title: r.title,
        typeName: RecordTypeConfig.configuration(r.type).displayName,
        happenedAt: r.happenedAt,
        content: r.content,
        followUp: r.followUp,
        studentNames: r.studentIds.map((id) => studentMap[id]?.name).filter(Boolean) as string[],
        attachmentNames: r.attachments.map((a) => (a.kind === "photo" ? "照片" : "录音")),
        parentPhones: r.studentIds.map((id) => studentMap[id]?.parentPhone).filter(Boolean) as string[],
      }));
      const blob = await exportLedgerPDF("班主任工作台账", items, redactPhone);
      downloadBlob(blob, `ledger-${Date.now()}.pdf`);
      toast.show("PDF 已下载");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "导出失败", true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <IOSNavBar title="导出 PDF" backHref="/mine" right={<button type="button" onClick={exportPdf} disabled={exporting}>{exporting ? "导出中" : "导出"}</button>} />
      <div className="page-content">
        <div className="form-field"><label>开始日期</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="form-field"><label>结束日期</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        <label className="ios-row" style={{ margin: "0 16px", display: "flex", gap: 8 }}>
          <input type="checkbox" checked={redactPhone} onChange={(e) => setRedactPhone(e.target.checked)} />
          导出时脱敏手机号
        </label>
      </div>
    </>
  );
}
