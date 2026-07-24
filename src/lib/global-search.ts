import { RecordTypeConfig } from "@/domain/models/work-record-type";
import type { StudentDTO, WorkRecordDTO } from "@/domain/use-cases/repositories";

export interface GlobalSearchResults {
  students: StudentDTO[];
  records: WorkRecordDTO[];
}

function normalizeKeyword(keyword: string): string {
  return keyword.trim().toLowerCase();
}

function includesKeyword(text: string | undefined, keyword: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(keyword);
}

function matchStudent(student: StudentDTO, keyword: string): boolean {
  if (includesKeyword(student.name, keyword)) return true;
  if (includesKeyword(student.studentNo, keyword)) return true;
  if (includesKeyword(student.note, keyword)) return true;
  if (includesKeyword(student.parentName, keyword)) return true;
  if (includesKeyword(student.parentPhone, keyword)) return true;
  return student.tags.some((tag) => includesKeyword(tag, keyword));
}

function matchRecord(record: WorkRecordDTO, keyword: string): boolean {
  if (includesKeyword(record.title, keyword)) return true;
  if (includesKeyword(record.content, keyword)) return true;
  if (includesKeyword(record.followUp, keyword)) return true;
  if (includesKeyword(record.location, keyword)) return true;
  const typeName = RecordTypeConfig.configuration(record.type).displayName;
  return includesKeyword(typeName, keyword);
}

/** 全局搜索：在学生与留痕中匹配关键词，返回分组结果。 */
export function searchStudentsAndRecords(
  students: StudentDTO[],
  records: WorkRecordDTO[],
  keyword: string,
): GlobalSearchResults {
  const normalized = normalizeKeyword(keyword);
  if (!normalized) {
    return { students: [], records: [] };
  }

  const activeStudents = students.filter((student) => !student.archived);

  return {
    students: activeStudents.filter((student) => matchStudent(student, normalized)),
    records: records.filter((record) => matchRecord(record, normalized)),
  };
}
