/** 班主任工作留痕类型（对应能力项 1–10）。 */
export type WorkRecordType =
  | "homeVisit"
  | "talk"
  | "classMeeting"
  | "parentMeeting"
  | "safetyEducation"
  | "discipline"
  | "classroomVisit"
  | "classDiary"
  | "lessonObservation"
  | "behaviorNote";

export const ALL_WORK_RECORD_TYPES: WorkRecordType[] = [
  "homeVisit",
  "talk",
  "classMeeting",
  "parentMeeting",
  "safetyEducation",
  "discipline",
  "classroomVisit",
  "classDiary",
  "lessonObservation",
  "behaviorNote",
];

export type RecordFormField = "location" | "followUp" | "participants";

export interface RecordTypeConfiguration {
  displayName: string;
  titlePrefix: string;
  fields: RecordFormField[];
  prefersStudents: boolean;
}

/** 留痕类型配置表：表单字段的唯一来源。 */
export const RecordTypeConfig = {
  configuration(forType: WorkRecordType): RecordTypeConfiguration {
    const map: Record<WorkRecordType, RecordTypeConfiguration> = {
      homeVisit: {
        displayName: "家访/电访",
        titlePrefix: "家访",
        fields: ["location", "followUp", "participants"],
        prefersStudents: true,
      },
      talk: {
        displayName: "谈心谈话",
        titlePrefix: "谈话",
        fields: ["followUp", "participants"],
        prefersStudents: true,
      },
      classMeeting: {
        displayName: "主题班会",
        titlePrefix: "班会",
        fields: ["location", "followUp"],
        prefersStudents: false,
      },
      parentMeeting: {
        displayName: "家长会/家校沟通",
        titlePrefix: "家校沟通",
        fields: ["location", "followUp", "participants"],
        prefersStudents: true,
      },
      safetyEducation: {
        displayName: "安全教育专项",
        titlePrefix: "安全教育",
        fields: ["location", "followUp"],
        prefersStudents: false,
      },
      discipline: {
        displayName: "违纪与处分登记",
        titlePrefix: "违纪登记",
        fields: ["followUp", "participants"],
        prefersStudents: true,
      },
      classroomVisit: {
        displayName: "课堂走访/值班",
        titlePrefix: "走访",
        fields: ["location", "followUp"],
        prefersStudents: false,
      },
      classDiary: {
        displayName: "班级工作日志",
        titlePrefix: "工作日志",
        fields: ["followUp"],
        prefersStudents: false,
      },
      lessonObservation: {
        displayName: "听课记录",
        titlePrefix: "听课",
        fields: ["location", "followUp"],
        prefersStudents: false,
      },
      behaviorNote: {
        displayName: "学生行为/奖惩说明",
        titlePrefix: "行为记录",
        fields: ["followUp", "participants"],
        prefersStudents: true,
      },
    };
    return map[forType];
  },
};
