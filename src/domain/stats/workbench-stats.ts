import { ALL_WORK_RECORD_TYPES, type WorkRecordType } from "@/domain/models/work-record-type";
import type { StudentDTO, WorkRecordDTO } from "@/domain/use-cases/repositories";

export interface WorkbenchStats {
  weekCount: number;
  monthCount: number;
  dueFollowUps: number;
  uncoveredStudents: number;
  byType: Record<WorkRecordType, number>;
}

type RecordWithFollowUpDue = WorkRecordDTO & { followUpDueAt?: Date };

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isActiveStudent(student: StudentDTO): boolean {
  return !student.archived;
}

function isDueFollowUp(record: WorkRecordDTO, now: Date): boolean {
  const dueAt = (record as RecordWithFollowUpDue).followUpDueAt;
  if (dueAt) return dueAt.getTime() <= now.getTime();
  return Boolean(record.followUp?.trim());
}

function countByType(records: WorkRecordDTO[]): Record<WorkRecordType, number> {
  const counts = Object.fromEntries(ALL_WORK_RECORD_TYPES.map((type) => [type, 0])) as Record<
    WorkRecordType,
    number
  >;
  for (const record of records) {
    counts[record.type] += 1;
  }
  return counts;
}

/** 计算工作台统计卡片所需指标。 */
export function computeWorkbenchStats(records: WorkRecordDTO[], students: StudentDTO[]): WorkbenchStats {
  const now = new Date();
  const weekStart = startOfWeek(now).getTime();
  const monthStart = startOfMonth(now).getTime();

  let weekCount = 0;
  let monthCount = 0;
  let dueFollowUps = 0;

  const coveredStudentIds = new Set<string>();

  for (const record of records) {
    const happenedAt = record.happenedAt.getTime();
    if (happenedAt >= weekStart) weekCount += 1;
    if (happenedAt >= monthStart) monthCount += 1;
    if (isDueFollowUp(record, now)) dueFollowUps += 1;
    for (const studentId of record.studentIds) {
      coveredStudentIds.add(studentId);
    }
  }

  const activeStudents = students.filter(isActiveStudent);
  const uncoveredStudents = activeStudents.filter((student) => !coveredStudentIds.has(student.id)).length;

  return {
    weekCount,
    monthCount,
    dueFollowUps,
    uncoveredStudents,
    byType: countByType(records),
  };
}
