import Dexie, { type EntityTable } from "dexie";

export interface ClassGroupRow {
  id: string;
  name: string;
  gradeYear: string;
  createdAt: number;
}

export interface StudentRow {
  id: string;
  classId: string;
  name: string;
  studentNo: string;
  gender?: string;
  parentName?: string;
  parentPhone?: string;
  tags: string[];
  note?: string;
}

export interface WorkRecordRow {
  id: string;
  classId: string;
  typeRaw: string;
  title: string;
  happenedAt: number;
  location?: string;
  studentIds: string[];
  content: string;
  followUp?: string;
  templateId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface AttachmentRow {
  id: string;
  recordId: string;
  kindRaw: string;
  relativePath: string;
  duration?: number;
  createdAt: number;
}

export interface GradeSheetRow {
  id: string;
  classId: string;
  examName: string;
  examDate: number;
  subjectNames: string[];
}

export interface GradeEntryRow {
  id: string;
  sheetId: string;
  studentNo: string;
  studentName: string;
  scoreKeys: string[];
  scoreValues: number[];
}

export interface AttendanceRow {
  id: string;
  studentId: string;
  date: number;
  statusRaw: string;
  note?: string;
}

export interface BehaviorPointRow {
  id: string;
  studentId: string;
  date: number;
  delta: number;
  reason: string;
  linkedRecordId?: string;
}

export interface RecordTemplateRow {
  id: string;
  typeRaw: string;
  name: string;
  bodySkeleton: string;
}

export interface MediaFileRow {
  relativePath: string;
  blob: Blob;
  mimeType: string;
}

export class HomeroomDatabase extends Dexie {
  classGroups!: EntityTable<ClassGroupRow, "id">;
  students!: EntityTable<StudentRow, "id">;
  workRecords!: EntityTable<WorkRecordRow, "id">;
  attachments!: EntityTable<AttachmentRow, "id">;
  gradeSheets!: EntityTable<GradeSheetRow, "id">;
  gradeEntries!: EntityTable<GradeEntryRow, "id">;
  attendances!: EntityTable<AttendanceRow, "id">;
  behaviorPoints!: EntityTable<BehaviorPointRow, "id">;
  recordTemplates!: EntityTable<RecordTemplateRow, "id">;
  mediaFiles!: EntityTable<MediaFileRow, "relativePath">;

  constructor(name = "HomeroomTrace") {
    super(name);
    this.version(1).stores({
      classGroups: "id, createdAt",
      students: "id, classId, studentNo",
      workRecords: "id, classId, happenedAt, typeRaw",
      attachments: "id, recordId, relativePath",
      gradeSheets: "id, classId, examDate",
      gradeEntries: "id, sheetId, studentNo",
      attendances: "id, studentId, date",
      behaviorPoints: "id, studentId, date",
      recordTemplates: "id, typeRaw",
      mediaFiles: "relativePath",
    });
  }
}

let dbInstance: HomeroomDatabase | null = null;

/** 获取 Dexie 单例；测试时可传入自定义库名。 */
export function getDatabase(name?: string): HomeroomDatabase {
  if (name) return new HomeroomDatabase(name);
  if (!dbInstance) dbInstance = new HomeroomDatabase();
  return dbInstance;
}

/** 重置单例（测试用）。 */
export function resetDatabaseSingleton(): void {
  dbInstance = null;
}
