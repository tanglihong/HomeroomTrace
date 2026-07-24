"use client";

import type { ChangeEvent, ReactNode } from "react";
import { IOSActionRow, IOSFileButton } from "@/features/common/ios-form";
import { IOSSection } from "@/features/common/ios-list";
import { useToast } from "@/features/common/toast";
import { downloadCsvTemplate, downloadExcelTemplate, readImportFile } from "@/lib/import-templates";

interface CsvImportPanelProps {
  title?: string;
  specs: string[];
  templateContent: string;
  csvTemplateFilename: string;
  excelTemplateFilename: string;
  csv: string;
  onCsvChange: (value: string) => void;
  disabled?: boolean;
  textareaPlaceholder?: string;
  children?: ReactNode;
}

/** 导入说明、模板下载与文件选择（支持 Excel / CSV） */
export function CsvImportPanel({
  title = "导入说明",
  specs,
  templateContent,
  csvTemplateFilename,
  excelTemplateFilename,
  csv,
  onCsvChange,
  disabled,
  textareaPlaceholder = "粘贴 CSV 内容，或选择 Excel / CSV 文件…",
  children,
}: CsvImportPanelProps) {
  const toast = useToast();

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      onCsvChange(await readImportFile(file));
      toast.show(`已读取：${file.name}`);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "文件读取失败", true);
    }
    e.target.value = "";
  };

  const onDownloadExcel = async () => {
    try {
      await downloadExcelTemplate(templateContent, excelTemplateFilename);
    } catch (err) {
      toast.show(err instanceof Error ? err.message : "模板下载失败", true);
    }
  };

  return (
    <>
      <IOSSection title={title}>
        <ul className="import-spec-list">
          {specs.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <IOSActionRow disabled={disabled} onClick={onDownloadExcel}>
          下载 Excel 模板（.xlsx）
        </IOSActionRow>
        <IOSActionRow disabled={disabled} onClick={() => downloadCsvTemplate(templateContent, csvTemplateFilename)}>
          下载 CSV 模板
        </IOSActionRow>
        <IOSFileButton
          accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          disabled={disabled}
          onChange={onFileSelected}
        >
          选择 Excel / CSV 文件
        </IOSFileButton>
      </IOSSection>
      {children}
      <div className="form-field">
        <textarea
          placeholder={textareaPlaceholder}
          value={csv}
          onChange={(e) => onCsvChange(e.target.value)}
          style={{ minHeight: 200 }}
          disabled={disabled}
        />
      </div>
    </>
  );
}
