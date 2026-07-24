"use client";

import { useState } from "react";
import { ALL_WORK_RECORD_TYPES, RecordTypeConfig } from "@/domain/models/work-record-type";
import { buildChecklist } from "@/domain/checklist/competency-checklist";
import { computeWorkbenchStats } from "@/domain/stats/workbench-stats";
import { exportLedgerPDF, downloadBlob } from "@/data/export/ledger-pdf-exporter";
import {
  downloadHtmlAsDoc,
  exportGroupedRecordsHtml,
  exportSemesterSummaryHtml,
} from "@/data/export/report-exporter";
import { LoadingOverlay } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";
import { toDateInputValue } from "@/lib/format";

export default function ExportPage() {
  const container = useAppContainer();
  const { records, students } = useDataStore();
  const toast = useToast();
  const [startDate, setStartDate] = useState(toDateInputValue(new Date(Date.now() - 30 * 86400000)));
  const [endDate, setEndDate] = useState(toDateInputValue(new Date()));
  const [redactPhone, setRedactPhone] = useState(true);
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);
    try {
      const classId = container.requireClassId();
      const recordList = await container.records.list(classId, {
        startDate: new Date(`${startDate}T00:00:00`),
        endDate: new Date(`${endDate}T23:59:59`),
      });
      const studentList = await container.students.list(classId);
      const studentMap = Object.fromEntries(studentList.map((s) => [s.id, s]));
      const items = recordList.map((r) => ({
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

  const exportGroupedHtml = async () => {
    setExporting(true);
    try {
      const classId = container.requireClassId();
      const recordList = await container.records.list(classId, {
        startDate: new Date(`${startDate}T00:00:00`),
        endDate: new Date(`${endDate}T23:59:59`),
      });
      const grouped: Partial<Record<(typeof ALL_WORK_RECORD_TYPES)[number], typeof recordList>> = {};
      for (const type of ALL_WORK_RECORD_TYPES) {
        grouped[type] = recordList.filter((r) => r.type === type);
      }
      const blob = exportGroupedRecordsHtml(grouped);
      downloadHtmlAsDoc(blob, `grouped-records-${Date.now()}`);
      toast.show("分组台账已导出");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "导出失败", true);
    } finally {
      setExporting(false);
    }
  };

  const exportSemesterSummary = async () => {
    if (!records || !students) {
      toast.show("数据加载中，请稍后再试", true);
      return;
    }
    setExporting(true);
    try {
      const stats = computeWorkbenchStats(records, students);
      const checklist = buildChecklist(records, students);
      const clazz = await container.classRepository.find(container.requireClassId());
      const title = `${clazz?.name ?? "班级"}学期工作摘要`;
      const blob = exportSemesterSummaryHtml(title, stats, checklist);
      downloadHtmlAsDoc(blob, `semester-summary-${Date.now()}`);
      toast.show("学期摘要已导出");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "导出失败", true);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <LoadingOverlay show={exporting} message="导出中…" />
      <IOSNavBar title="导出 PDF" backHref="/mine" right={<button type="button" onClick={exportPdf} disabled={exporting}>{exporting ? "导出中" : "导出 PDF"}</button>} />
      <div className="page-content">
        <div className="form-field"><label>开始日期</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
        <div className="form-field"><label>结束日期</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
        <label className="ios-row" style={{ margin: "0 16px", display: "flex", gap: 8 }}>
          <input type="checkbox" checked={redactPhone} onChange={(e) => setRedactPhone(e.target.checked)} />
          导出时脱敏手机号
        </label>
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
          <button type="button" className="ios-btn ios-btn-tinted ios-btn-full" onClick={exportGroupedHtml} disabled={exporting}>
            导出分组 HTML 台账
          </button>
          <button type="button" className="ios-btn ios-btn-tinted ios-btn-full" onClick={exportSemesterSummary} disabled={exporting}>
            导出学期工作摘要
          </button>
        </div>
      </div>
    </>
  );
}
