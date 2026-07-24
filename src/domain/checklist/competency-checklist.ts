import { ALL_WORK_RECORD_TYPES, RecordTypeConfig, type WorkRecordType } from "@/domain/models/work-record-type";
import type { StudentDTO, WorkRecordDTO } from "@/domain/use-cases/repositories";

export interface CompetencyChecklistItem {
  type: WorkRecordType;
  displayName: string;
  count: number;
  required: number;
  done: boolean;
}

/** 学期能力项最低留痕次数（0 表示按需记录）。 */
const COMPETENCY_MIN_COUNTS: Record<WorkRecordType, number> = {
  homeVisit: 1,
  talk: 2,
  classMeeting: 2,
  parentMeeting: 1,
  safetyEducation: 1,
  discipline: 0,
  classroomVisit: 2,
  classDiary: 4,
  lessonObservation: 1,
  behaviorNote: 0,
};

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

/** 按能力项生成学期检查清单，对照已有留痕统计完成情况。 */
export function buildChecklist(records: WorkRecordDTO[], _students: StudentDTO[]): CompetencyChecklistItem[] {
  const counts = countByType(records);

  return ALL_WORK_RECORD_TYPES.map((type) => {
    const required = COMPETENCY_MIN_COUNTS[type];
    const count = counts[type];
    return {
      type,
      displayName: RecordTypeConfig.configuration(type).displayName,
      count,
      required,
      done: count >= required,
    };
  });
}
