import type { WorkRecordDTO } from "@/domain/use-cases/repositories";
import { RecordTypeConfig } from "@/domain/models/work-record-type";

export function formatRecordDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function recordRowSubtitle(record: WorkRecordDTO): string {
  const typeName = RecordTypeConfig.configuration(record.type).displayName;
  const icons = record.attachments.map((a) => (a.kind === "photo" ? "📷" : "🎙")).join("");
  return `${formatRecordDate(record.happenedAt)} · ${typeName}${icons ? ` ${icons}` : ""}`;
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value: string): Date {
  return new Date(`${value}T12:00:00`);
}
