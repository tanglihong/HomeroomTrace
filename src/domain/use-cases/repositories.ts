import type { WorkRecordType } from "@/domain/models/work-record-type";

export type AttendanceStatus = "present" | "late" | "absent" | "leave";

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "出勤",
  late: "迟到",
  absent: "缺勤",
  leave: "请假",
};

export type AttachmentKind = "photo" | "audio";

export interface WorkRecordFilter {
  type?: WorkRecordType;
  startDate?: Date;
  endDate?: Date;
  studentId?: string;
  keyword?: string;
  hasAttachment?: boolean;
  /** 列表场景可跳过附件查询以提升性能 */
  includeAttachments?: boolean;
}

export interface StudentDTO {
  id: string;
  classId: string;
  name: string;
  studentNo: string;
  gender?: string;
  parentName?: string;
  parentPhone?: string;
  tags: string[];
  note?: string;
  archived?: boolean;
}

export interface AttachmentDraft {
  kind: AttachmentKind;
  relativePath: string;
  duration?: number;
}

export interface WorkRecordDraft {
  classId: string;
  type: WorkRecordType;
  title: string;
  happenedAt: Date;
  location?: string;
  studentIds: string[];
  content: string;
  followUp?: string;
  followUpDueAt?: Date;
  templateId?: string;
  attachments: AttachmentDraft[];
}

export interface AttachmentDTO {
  id: string;
  kind: AttachmentKind;
  relativePath: string;
  duration?: number;
}

export interface WorkRecordDTO {
  id: string;
  classId: string;
  type: WorkRecordType;
  title: string;
  happenedAt: Date;
  location?: string;
  studentIds: string[];
  content: string;
  followUp?: string;
  followUpDueAt?: Date;
  templateId?: string;
  attachments: AttachmentDTO[];
  createdAt: Date;
  updatedAt: Date;
}

export interface GradeImportRow {
  studentNo: string;
  studentName: string;
  scores: Record<string, number>;
}

export interface GradeSheetDTO {
  id: string;
  examName: string;
  examDate: Date;
  subjectNames: string[];
}

export interface AttendanceDTO {
  id: string;
  studentId: string;
  date: Date;
  status: AttendanceStatus;
  note?: string;
}

export interface BehaviorPointDTO {
  id: string;
  studentId: string;
  date: Date;
  delta: number;
  reason: string;
  linkedRecordId?: string;
}

export interface RecordTemplateDTO {
  id: string;
  type: WorkRecordType;
  name: string;
  bodySkeleton: string;
  isUserCreated?: boolean;
}

export interface StudentImportRow {
  studentNo: string;
  name: string;
  gender?: string;
  parentName?: string;
  parentPhone?: string;
  note?: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export interface GradeAnalyzeRow {
  studentNo: string;
  studentName: string;
  scores: Record<string, number>;
}

export interface ClassGroupDTO {
  id: string;
  name: string;
  gradeYear: string;
  semester?: string;
  createdAt: Date;
}

export type ParentCommunicationChannel = "phone" | "wechat" | "sms" | "other";

export interface ParentCommunicationDTO {
  id: string;
  studentId: string;
  date: Date;
  channel: ParentCommunicationChannel;
  summary: string;
  linkedRecordId?: string;
}

export interface StudentRepository {
  add(classId: string, name: string, studentNo: string, gender?: string, parentName?: string, parentPhone?: string, note?: string): Promise<string>;
  update(id: string, name: string, studentNo: string, gender?: string, parentName?: string, parentPhone?: string, note?: string): Promise<void>;
  setTags(id: string, tags: string[]): Promise<void>;
  importBatch(classId: string, rows: StudentImportRow[]): Promise<ImportResult>;
  list(classId: string): Promise<StudentDTO[]>;
  listActive(classId: string): Promise<StudentDTO[]>;
  find(id: string): Promise<StudentDTO | undefined>;
  archive(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  isStudentNoTaken(classId: string, studentNo: string, excludeId?: string): Promise<boolean>;
}

export interface WorkRecordRepository {
  add(draft: WorkRecordDraft): Promise<string>;
  update(id: string, draft: WorkRecordDraft): Promise<void>;
  delete(id: string): Promise<void>;
  restore(record: WorkRecordDTO): Promise<void>;
  list(classId: string, filter: WorkRecordFilter): Promise<WorkRecordDTO[]>;
  listDueFollowUps(classId: string): Promise<WorkRecordDTO[]>;
  find(id: string): Promise<WorkRecordDTO | undefined>;
}

export interface GradeRepository {
  importSheet(classId: string, examName: string, examDate: Date, subjectNames: string[], rows: GradeImportRow[]): Promise<{ sheetId: string; warnings: string[]; importedCount: number }>;
  listSheets(classId: string): Promise<GradeSheetDTO[]>;
  entries(sheetId: string): Promise<GradeAnalyzeRow[]>;
  previousTotals(classId: string, beforeSheetId: string): Promise<Record<string, number>>;
}

export interface AttendanceRepository {
  add(studentId: string, date: Date, status: AttendanceStatus, note?: string): Promise<void>;
  batchAdd(entries: { studentId: string; date: Date; status: AttendanceStatus; note?: string }[]): Promise<void>;
  list(studentId: string): Promise<AttendanceDTO[]>;
  listByClass(classId: string, date?: Date): Promise<AttendanceDTO[]>;
}

export interface BehaviorRepository {
  add(studentId: string, date: Date, delta: number, reason: string, linkedRecordId?: string): Promise<void>;
  list(studentId: string): Promise<BehaviorPointDTO[]>;
  totalPoints(studentId: string): Promise<number>;
}

export interface TemplateRepository {
  seedDefaultsIfNeeded(): Promise<void>;
  list(type: WorkRecordType): Promise<RecordTemplateDTO[]>;
  saveUser(type: WorkRecordType, name: string, body: string): Promise<string>;
  deleteUser(id: string): Promise<void>;
}

export interface ClassRepository {
  list(): Promise<ClassGroupDTO[]>;
  add(name: string, gradeYear: string): Promise<ClassGroupDTO>;
  find(id: string): Promise<ClassGroupDTO | undefined>;
  update(id: string, name: string, gradeYear: string, semester?: string): Promise<void>;
}

export interface ParentCommunicationRepository {
  add(studentId: string, date: Date, channel: ParentCommunicationChannel, summary: string, linkedRecordId?: string): Promise<string>;
  list(studentId: string): Promise<ParentCommunicationDTO[]>;
  delete(id: string): Promise<void>;
}

export interface MediaStore {
  save(data: Blob, ownerFolder: string, fileExtension: string): Promise<string>;
  get(relativePath: string): Promise<Blob | undefined>;
  url(relativePath: string): Promise<string>;
  delete(relativePath: string): Promise<void>;
}

export class RepositoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepositoryError";
  }

  static notFound = () => new RepositoryError("未找到数据");
  static invalidClass = () => new RepositoryError("请先选择或创建班级");
  static validation = (message: string) => new RepositoryError(message);
}
