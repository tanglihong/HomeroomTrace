"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ClassGroupDTO } from "@/domain/use-cases/repositories";
import { buildChecklist } from "@/domain/checklist/competency-checklist";
import { computeWorkbenchStats } from "@/domain/stats/workbench-stats";
import { BackupService } from "@/data/export/backup-service";
import { downloadBlob } from "@/data/export/ledger-pdf-exporter";
import {
  downloadHtmlAsDoc,
  exportSemesterSummaryHtml,
} from "@/data/export/report-exporter";
import { IOSActionRow, IOSButton, IOSFileButton, IOSFormRow, IOSFormSection } from "@/features/common/ios-form";
import { IOSSection, LoadingOverlay } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { needsBackupReminder, setLastBackupAt } from "@/lib/app-preferences";
import { useDataStore } from "@/lib/data-store";
import { useSavingAction } from "@/lib/hooks";
import { getMediaStorageStats, type MediaStorageStats } from "@/lib/storage-stats";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MineView() {
  const container = useAppContainer();
  const { currentClassId, setCurrentClassId } = container;
  const { records, students, invalidateAll } = useDataStore();
  const toast = useToast();
  const { saving, runSaving, savingMessage } = useSavingAction();
  const [clazz, setClazz] = useState<ClassGroupDTO | null>(null);
  const [allClasses, setAllClasses] = useState<ClassGroupDTO[]>([]);
  const [name, setName] = useState("");
  const [gradeYear, setGradeYear] = useState("");
  const [semester, setSemester] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [storageStats, setStorageStats] = useState<MediaStorageStats | null>(null);
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  const reloadClass = useCallback(async () => {
    try {
      const list = await container.classRepository.list();
      setAllClasses(list);
      const classId = container.requireClassId();
      const c = await container.classRepository.find(classId);
      setClazz(c ?? null);
      if (c) {
        setName(c.name);
        setGradeYear(c.gradeYear);
        setSemester(c.semester ?? "");
      }
      setLoaded(true);
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "加载失败", true);
    }
  }, [container, toast]);

  useEffect(() => {
    if (loaded) return;
    void reloadClass();
  }, [loaded, reloadClass]);

  useEffect(() => {
    void getMediaStorageStats().then(setStorageStats);
    setShowBackupReminder(needsBackupReminder());
  }, []);

  const saveClass = async () => {
    if (!clazz) return;
    try {
      await runSaving(async () => {
        await container.classRepository.update(clazz.id, name, gradeYear, semester || undefined);
        toast.show("班级信息已保存");
      });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "保存失败", true);
    }
  };

  const switchClass = (id: string) => {
    if (id === currentClassId) return;
    setCurrentClassId(id);
    invalidateAll();
    setLoaded(false);
    void reloadClass();
  };

  const exportBackup = async () => {
    try {
      const blob = await BackupService.exportBackup();
      downloadBlob(blob, `HomeroomTrace-Backup-${Date.now()}.zip`);
      setLastBackupAt(Date.now());
      setShowBackupReminder(false);
      toast.show("备份已下载");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "备份失败", true);
    }
  };

  const restoreBackup = async (file: File) => {
    try {
      await BackupService.restoreBackup(file);
      toast.show("还原完成，请刷新页面");
      window.location.reload();
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "还原失败", true);
    }
  };

  const exportSemesterSummary = async () => {
    if (!records || !students) {
      toast.show("数据加载中，请稍后再试", true);
      return;
    }
    try {
      const stats = computeWorkbenchStats(records, students);
      const checklist = buildChecklist(records, students);
      const title = `${name || "班级"}学期工作摘要`;
      const blob = exportSemesterSummaryHtml(title, stats, checklist);
      downloadHtmlAsDoc(blob, `semester-summary-${Date.now()}`);
      toast.show("学期摘要已导出");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "导出失败", true);
    }
  };

  return (
    <>
      <LoadingOverlay show={saving} message={savingMessage} />
      <IOSNavBar title="我的" large />
      <div className="page-content">
        {allClasses.length > 1 && (
          <IOSFormSection title="切换班级">
            {allClasses.map((c) => (
              <IOSActionRow key={c.id} onClick={() => switchClass(c.id)}>
                {c.name}{c.id === currentClassId ? "（当前）" : ""}
              </IOSActionRow>
            ))}
          </IOSFormSection>
        )}
        <IOSFormSection title="班级信息">
          <IOSFormRow label="名称">
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </IOSFormRow>
          <IOSFormRow label="学年">
            <input value={gradeYear} onChange={(e) => setGradeYear(e.target.value)} />
          </IOSFormRow>
          <IOSFormRow label="学期">
            <input value={semester} onChange={(e) => setSemester(e.target.value)} placeholder="如：2024-2025 上学期" />
          </IOSFormRow>
        </IOSFormSection>
        <IOSButton variant="filled" fullWidth onClick={saveClass} disabled={saving}>
          {saving ? "保存中…" : "保存班级信息"}
        </IOSButton>
        {storageStats && (
          <IOSSection title="存储占用" footer="附件保存在本设备 IndexedDB">
            <div className="ios-row">
              {storageStats.count} 个媒体文件 · {formatBytes(storageStats.bytes)}
            </div>
          </IOSSection>
        )}
        <IOSSection title="导出">
          <Link href="/mine/export" prefetch className="ios-row has-chevron">
            导出工作台账 PDF
          </Link>
          <button type="button" className="ios-row" style={{ width: "100%", textAlign: "left" }} onClick={() => void exportSemesterSummary()}>
            导出学期工作摘要
          </button>
        </IOSSection>
        <IOSSection
          title="备份与还原"
          footer="还原文件须为本应用「导出备份 ZIP」，包含 Store 与 Media 目录"
        >
          {showBackupReminder && (
            <div className="ios-row record-subtitle" style={{ color: "#ff9500" }}>
              已超过 7 天未备份，建议尽快导出备份
            </div>
          )}
          <IOSActionRow onClick={exportBackup}>导出备份 ZIP</IOSActionRow>
          <IOSFileButton
            accept=".zip"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) restoreBackup(file);
            }}
          >
            从备份还原
          </IOSFileButton>
        </IOSSection>
        <p style={{ padding: "0 16px", color: "#8e8e93", fontSize: 13, textAlign: "center" }}>
          数据仅存于本设备，不上传云端
        </p>
      </div>
    </>
  );
}
