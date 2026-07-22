"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ClassGroupDTO } from "@/domain/use-cases/repositories";
import { BackupService } from "@/data/export/backup-service";
import { downloadBlob } from "@/data/export/ledger-pdf-exporter";
import { IOSActionRow, IOSButton, IOSFileButton, IOSFormRow, IOSFormSection } from "@/features/common/ios-form";
import { IOSSection } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";

export function MineView() {
  const container = useAppContainer();
  const toast = useToast();
  const [clazz, setClazz] = useState<ClassGroupDTO | null>(null);
  const [name, setName] = useState("");
  const [gradeYear, setGradeYear] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (loaded) return;
    (async () => {
      try {
        const classId = container.requireClassId();
        const c = await container.classRepository.find(classId);
        setClazz(c ?? null);
        if (c) {
          setName(c.name);
          setGradeYear(c.gradeYear);
        }
        setLoaded(true);
      } catch (e) {
        toast.show(e instanceof Error ? e.message : "加载失败", true);
      }
    })();
  }, [container, loaded, toast]);

  const saveClass = async () => {
    if (!clazz) return;
    try {
      await container.classRepository.update(clazz.id, name, gradeYear);
      toast.show("班级信息已保存");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "保存失败", true);
    }
  };

  const exportBackup = async () => {
    try {
      const blob = await BackupService.exportBackup();
      downloadBlob(blob, `HomeroomTrace-Backup-${Date.now()}.zip`);
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

  return (
    <>
      <IOSNavBar title="我的" large />
      <div className="page-content">
        <IOSFormSection title="班级信息">
          <IOSFormRow label="名称">
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </IOSFormRow>
          <IOSFormRow label="学年">
            <input value={gradeYear} onChange={(e) => setGradeYear(e.target.value)} />
          </IOSFormRow>
        </IOSFormSection>
        <IOSButton variant="filled" fullWidth onClick={saveClass}>
          保存班级信息
        </IOSButton>
        <IOSSection title="导出">
          <Link href="/mine/export" prefetch className="ios-row has-chevron">
            导出工作台账 PDF
          </Link>
        </IOSSection>
        <IOSSection title="备份与还原">
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
