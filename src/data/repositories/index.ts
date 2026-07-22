import { v4 as uuidv4 } from "uuid";
import type {
  AttendanceDTO,
  AttendanceRepository,
  AttendanceStatus,
  BehaviorPointDTO,
  BehaviorRepository,
  ClassGroupDTO,
  ClassRepository,
  GradeAnalyzeRow,
  GradeImportRow,
  GradeRepository,
  GradeSheetDTO,
  ImportResult,
  RecordTemplateDTO,
  StudentDTO,
  StudentImportRow,
  StudentRepository,
  TemplateRepository,
  WorkRecordDraft,
  WorkRecordDTO,
  WorkRecordFilter,
  WorkRecordRepository,
} from "@/domain/use-cases/repositories";
import { RepositoryError } from "@/domain/use-cases/repositories";
import type { WorkRecordType } from "@/domain/models/work-record-type";
import { getDatabase } from "@/data/db/schema";
import type { IndexedDBMediaStore } from "@/data/storage/media-store";

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function endOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.getTime();
}

export class DexieClassRepository implements ClassRepository {
  async list(): Promise<ClassGroupDTO[]> {
    const rows = await getDatabase().classGroups.orderBy("createdAt").toArray();
    return rows.map((r) => ({ id: r.id, name: r.name, gradeYear: r.gradeYear, createdAt: new Date(r.createdAt) }));
  }

  async add(name: string, gradeYear: string): Promise<ClassGroupDTO> {
    const row = { id: uuidv4(), name, gradeYear, createdAt: Date.now() };
    await getDatabase().classGroups.add(row);
    return { id: row.id, name, gradeYear, createdAt: new Date(row.createdAt) };
  }

  async find(id: string): Promise<ClassGroupDTO | undefined> {
    const r = await getDatabase().classGroups.get(id);
    if (!r) return undefined;
    return { id: r.id, name: r.name, gradeYear: r.gradeYear, createdAt: new Date(r.createdAt) };
  }

  async update(id: string, name: string, gradeYear: string): Promise<void> {
    const r = await getDatabase().classGroups.get(id);
    if (!r) throw RepositoryError.notFound();
    await getDatabase().classGroups.put({ ...r, name, gradeYear });
  }
}

export class DexieStudentRepository implements StudentRepository {
  async add(classId: string, name: string, studentNo: string, gender?: string, parentName?: string, parentPhone?: string, note?: string): Promise<string> {
    const clazz = await getDatabase().classGroups.get(classId);
    if (!clazz) throw RepositoryError.invalidClass();
    const id = uuidv4();
    await getDatabase().students.add({ id, classId, name, studentNo, gender, parentName, parentPhone, tags: [], note });
    return id;
  }

  async update(id: string, name: string, studentNo: string, gender?: string, parentName?: string, parentPhone?: string, note?: string): Promise<void> {
    const s = await getDatabase().students.get(id);
    if (!s) throw RepositoryError.notFound();
    await getDatabase().students.put({ ...s, name, studentNo, gender, parentName, parentPhone, note });
  }

  async setTags(id: string, tags: string[]): Promise<void> {
    const s = await getDatabase().students.get(id);
    if (!s) throw RepositoryError.notFound();
    await getDatabase().students.put({ ...s, tags });
  }

  async importBatch(classId: string, rows: StudentImportRow[]): Promise<ImportResult> {
    const clazz = await getDatabase().classGroups.get(classId);
    if (!clazz) throw RepositoryError.invalidClass();
    const existing = new Set((await this.list(classId)).map((s) => s.studentNo));
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      if (existing.has(row.studentNo)) {
        skipped++;
        errors.push(`学号 ${row.studentNo} 已存在，已跳过`);
        continue;
      }
      await this.add(classId, row.name, row.studentNo, row.gender, row.parentName, row.parentPhone, row.note);
      existing.add(row.studentNo);
      imported++;
    }
    return { imported, skipped, errors };
  }

  async list(classId: string): Promise<StudentDTO[]> {
    const rows = await getDatabase().students.where("classId").equals(classId).sortBy("studentNo");
    return rows.map(mapStudent);
  }

  async find(id: string): Promise<StudentDTO | undefined> {
    const s = await getDatabase().students.get(id);
    return s ? mapStudent(s) : undefined;
  }
}

function mapStudent(s: { id: string; classId: string; name: string; studentNo: string; gender?: string; parentName?: string; parentPhone?: string; tags: string[]; note?: string }): StudentDTO {
  return { id: s.id, classId: s.classId, name: s.name, studentNo: s.studentNo, gender: s.gender, parentName: s.parentName, parentPhone: s.parentPhone, tags: s.tags, note: s.note };
}

export class DexieWorkRecordRepository implements WorkRecordRepository {
  constructor(private mediaStore: IndexedDBMediaStore) {}

  async add(draft: WorkRecordDraft): Promise<string> {
    this.validate(draft);
    const clazz = await getDatabase().classGroups.get(draft.classId);
    if (!clazz) throw RepositoryError.invalidClass();
    const id = uuidv4();
    const now = Date.now();
    await getDatabase().workRecords.add({
      id,
      classId: draft.classId,
      typeRaw: draft.type,
      title: draft.title,
      happenedAt: draft.happenedAt.getTime(),
      location: draft.location,
      studentIds: draft.studentIds,
      content: draft.content,
      followUp: draft.followUp,
      templateId: draft.templateId,
      createdAt: now,
      updatedAt: now,
    });
    for (const item of draft.attachments) {
      await getDatabase().attachments.add({
        id: uuidv4(),
        recordId: id,
        kindRaw: item.kind,
        relativePath: item.relativePath,
        duration: item.duration,
        createdAt: now,
      });
    }
    return id;
  }

  async update(id: string, draft: WorkRecordDraft): Promise<void> {
    this.validate(draft);
    const entity = await getDatabase().workRecords.get(id);
    if (!entity) throw RepositoryError.notFound();
    const attachments = await getDatabase().attachments.where("recordId").equals(id).toArray();
    const desiredPaths = new Set(draft.attachments.map((a) => a.relativePath));
    const currentPaths = new Set(attachments.map((a) => a.relativePath));
    for (const att of attachments) {
      if (!desiredPaths.has(att.relativePath)) {
        await this.mediaStore.delete(att.relativePath).catch(() => {});
        await getDatabase().attachments.delete(att.id);
      }
    }
    for (const item of draft.attachments) {
      if (!currentPaths.has(item.relativePath)) {
        await getDatabase().attachments.add({
          id: uuidv4(),
          recordId: id,
          kindRaw: item.kind,
          relativePath: item.relativePath,
          duration: item.duration,
          createdAt: Date.now(),
        });
      }
    }
    await getDatabase().workRecords.put({
      ...entity,
      typeRaw: draft.type,
      title: draft.title,
      happenedAt: draft.happenedAt.getTime(),
      location: draft.location,
      studentIds: draft.studentIds,
      content: draft.content,
      followUp: draft.followUp,
      templateId: draft.templateId,
      updatedAt: Date.now(),
    });
  }

  async delete(id: string): Promise<void> {
    const entity = await getDatabase().workRecords.get(id);
    if (!entity) throw RepositoryError.notFound();
    const attachments = await getDatabase().attachments.where("recordId").equals(id).toArray();
    for (const att of attachments) {
      await this.mediaStore.delete(att.relativePath).catch(() => {});
      await getDatabase().attachments.delete(att.id);
    }
    await getDatabase().workRecords.delete(id);
  }

  async list(classId: string, filter: WorkRecordFilter): Promise<WorkRecordDTO[]> {
    const all = await getDatabase().workRecords.where("classId").equals(classId).toArray();
    const filtered = all
      .filter((e) => {
        if (filter.type && e.typeRaw !== filter.type) return false;
        if (filter.startDate && e.happenedAt < startOfDay(filter.startDate)) return false;
        if (filter.endDate && e.happenedAt > endOfDay(filter.endDate)) return false;
        if (filter.studentId && !e.studentIds.includes(filter.studentId)) return false;
        if (filter.keyword?.trim()) {
          const kw = filter.keyword.trim().toLowerCase();
          const hit =
            e.title.toLowerCase().includes(kw) ||
            e.content.toLowerCase().includes(kw) ||
            (e.followUp?.toLowerCase().includes(kw) ?? false);
          if (!hit) return false;
        }
        return true;
      })
      .sort((a, b) => b.happenedAt - a.happenedAt);

    if (filtered.length === 0) return [];

    const recordIds = filtered.map((e) => e.id);
    const allAttachments = await getDatabase().attachments.where("recordId").anyOf(recordIds).toArray();
    const attachmentsByRecord = new Map<string, typeof allAttachments>();
    for (const att of allAttachments) {
      const list = attachmentsByRecord.get(att.recordId) ?? [];
      list.push(att);
      attachmentsByRecord.set(att.recordId, list);
    }

    return filtered.map((e) => this.mapDTOWithAttachments(e, attachmentsByRecord.get(e.id) ?? []));
  }

  async find(id: string): Promise<WorkRecordDTO | undefined> {
    const e = await getDatabase().workRecords.get(id);
    if (!e) return undefined;
    const attachments = await getDatabase().attachments.where("recordId").equals(id).toArray();
    return this.mapDTOWithAttachments(e, attachments);
  }

  private validate(draft: WorkRecordDraft): void {
    if (!draft.title.trim()) throw RepositoryError.validation("请填写标题");
  }

  private mapDTOWithAttachments(
    e: {
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
    },
    attachments: { id: string; kindRaw: string; relativePath: string; duration?: number }[],
  ): WorkRecordDTO {
    return {
      id: e.id,
      classId: e.classId,
      type: e.typeRaw as WorkRecordType,
      title: e.title,
      happenedAt: new Date(e.happenedAt),
      location: e.location,
      studentIds: e.studentIds,
      content: e.content,
      followUp: e.followUp,
      templateId: e.templateId,
      attachments: attachments.map((a) => ({
        id: a.id,
        kind: a.kindRaw as "photo" | "audio",
        relativePath: a.relativePath,
        duration: a.duration,
      })),
      createdAt: new Date(e.createdAt),
      updatedAt: new Date(e.updatedAt),
    };
  }
}

export class DexieGradeRepository implements GradeRepository {
  async importSheet(classId: string, examName: string, examDate: Date, subjectNames: string[], rows: GradeImportRow[]): Promise<{ sheetId: string; warnings: string[]; importedCount: number }> {
    const clazz = await getDatabase().classGroups.get(classId);
    if (!clazz) throw RepositoryError.invalidClass();
    const rosterNos = new Set((await getDatabase().students.where("classId").equals(classId).toArray()).map((s) => s.studentNo));
    const warnings: string[] = [];
    const validRows = rows.filter((row) => {
      if (rosterNos.has(row.studentNo)) return true;
      warnings.push(`学号 ${row.studentNo}（${row.studentName}）不在名册中，已跳过`);
      return false;
    });
    if (validRows.length === 0) throw RepositoryError.validation("没有可导入的成绩行，请先维护学生名册");
    const sheetId = uuidv4();
    await getDatabase().gradeSheets.add({ id: sheetId, classId, examName, examDate: examDate.getTime(), subjectNames });
    for (const row of validRows) {
      const keys = Object.keys(row.scores);
      await getDatabase().gradeEntries.add({
        id: uuidv4(),
        sheetId,
        studentNo: row.studentNo,
        studentName: row.studentName,
        scoreKeys: keys,
        scoreValues: keys.map((k) => row.scores[k] ?? 0),
      });
    }
    return { sheetId, warnings, importedCount: validRows.length };
  }

  async listSheets(classId: string): Promise<GradeSheetDTO[]> {
    const rows = await getDatabase().gradeSheets.where("classId").equals(classId).toArray();
    return rows
      .sort((a, b) => b.examDate - a.examDate)
      .map((s) => ({ id: s.id, examName: s.examName, examDate: new Date(s.examDate), subjectNames: s.subjectNames }));
  }

  async entries(sheetId: string): Promise<GradeAnalyzeRow[]> {
    const sheet = await getDatabase().gradeSheets.get(sheetId);
    if (!sheet) throw RepositoryError.notFound();
    const entries = await getDatabase().gradeEntries.where("sheetId").equals(sheetId).toArray();
    return entries.map((e) => ({
      studentNo: e.studentNo,
      studentName: e.studentName,
      scores: Object.fromEntries(e.scoreKeys.map((k, i) => [k, e.scoreValues[i] ?? 0])),
    }));
  }

  async previousTotals(classId: string, beforeSheetId: string): Promise<Record<string, number>> {
    const current = await getDatabase().gradeSheets.get(beforeSheetId);
    if (!current) return {};
    const sheets = (await getDatabase().gradeSheets.where("classId").equals(classId).toArray())
      .filter((s) => s.examDate < current.examDate && s.id !== beforeSheetId)
      .sort((a, b) => b.examDate - a.examDate);
    const previous = sheets[0];
    if (!previous) return {};
    const entries = await getDatabase().gradeEntries.where("sheetId").equals(previous.id).toArray();
    const totals: Record<string, number> = {};
    for (const entry of entries) {
      totals[entry.studentNo] = entry.scoreValues.reduce((a, b) => a + b, 0);
    }
    return totals;
  }
}

export class DexieAttendanceRepository implements AttendanceRepository {
  async add(studentId: string, date: Date, status: AttendanceStatus, note?: string): Promise<void> {
    const student = await getDatabase().students.get(studentId);
    if (!student) throw RepositoryError.notFound();
    await getDatabase().attendances.add({ id: uuidv4(), studentId, date: date.getTime(), statusRaw: status, note });
  }

  async list(studentId: string): Promise<AttendanceDTO[]> {
    const rows = await getDatabase().attendances.where("studentId").equals(studentId).toArray();
    return rows
      .sort((a, b) => b.date - a.date)
      .map((a) => ({ id: a.id, studentId, date: new Date(a.date), status: a.statusRaw as AttendanceStatus, note: a.note }));
  }
}

export class DexieBehaviorRepository implements BehaviorRepository {
  async add(studentId: string, date: Date, delta: number, reason: string, linkedRecordId?: string): Promise<void> {
    const student = await getDatabase().students.get(studentId);
    if (!student) throw RepositoryError.notFound();
    await getDatabase().behaviorPoints.add({ id: uuidv4(), studentId, date: date.getTime(), delta, reason, linkedRecordId });
  }

  async list(studentId: string): Promise<BehaviorPointDTO[]> {
    const rows = await getDatabase().behaviorPoints.where("studentId").equals(studentId).toArray();
    return rows
      .sort((a, b) => b.date - a.date)
      .map((b) => ({ id: b.id, studentId, date: new Date(b.date), delta: b.delta, reason: b.reason, linkedRecordId: b.linkedRecordId }));
  }

  async totalPoints(studentId: string): Promise<number> {
    const list = await this.list(studentId);
    return list.reduce((sum, item) => sum + item.delta, 0);
  }
}

export class DexieTemplateRepository implements TemplateRepository {
  async seedDefaultsIfNeeded(): Promise<void> {
    const count = await getDatabase().recordTemplates.count();
    if (count > 0) return;
    const seeds: [WorkRecordType, string, string][] = [
      ["homeVisit", "家访通用模板", "时间：\n对象：\n事由：\n沟通要点：\n家长反馈：\n后续跟进：\n"],
      ["talk", "谈心谈话模板", "谈话对象：\n问题简述：\n学生态度：\n引导要点：\n约定事项：\n"],
      ["classMeeting", "主题班会模板", "主题：\n目标：\n过程摘要：\n学生发言：\n决议/行动：\n"],
      ["parentMeeting", "家长会纪要模板", "会议主题：\n参会情况：\n通报内容：\n家长意见：\n后续安排：\n"],
      ["safetyEducation", "安全教育模板", "教育主题：\n覆盖对象：\n内容要点：\n学生反馈：\n"],
      ["discipline", "违纪登记模板", "事实经过：\n涉及学生：\n处理意见：\n家长沟通：\n跟进：\n"],
      ["classroomVisit", "走访值班模板", "巡查时段：\n发现情况：\n处理措施：\n"],
      ["classDiary", "工作日志模板", "今日重点：\n完成事项：\n待办：\n备注：\n"],
      ["lessonObservation", "听课记录模板", "科目/教师：\n课堂亮点：\n建议：\n"],
      ["behaviorNote", "行为记录模板", "行为描述：\n奖惩意见：\n教育引导：\n"],
    ];
    await getDatabase().recordTemplates.bulkAdd(
      seeds.map(([type, name, bodySkeleton]) => ({ id: uuidv4(), typeRaw: type, name, bodySkeleton })),
    );
  }

  async list(type: WorkRecordType): Promise<RecordTemplateDTO[]> {
    const rows = await getDatabase().recordTemplates.where("typeRaw").equals(type).toArray();
    return rows.map((t) => ({ id: t.id, type: t.typeRaw as WorkRecordType, name: t.name, bodySkeleton: t.bodySkeleton }));
  }
}
