"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { GradeSheetDTO, StudentDTO, WorkRecordDTO } from "@/domain/use-cases/repositories";
import { useAppContainer } from "@/lib/app-container";

interface DataStoreValue {
  students: StudentDTO[] | null;
  records: WorkRecordDTO[] | null;
  gradeSheets: GradeSheetDTO[] | null;
  refreshStudents: (force?: boolean) => Promise<StudentDTO[]>;
  refreshRecords: (force?: boolean) => Promise<WorkRecordDTO[]>;
  refreshGradeSheets: (force?: boolean) => Promise<GradeSheetDTO[]>;
  upsertRecord: (record: WorkRecordDTO) => void;
  removeRecord: (id: string) => void;
  invalidateAll: () => void;
}

const DataStoreContext = createContext<DataStoreValue | null>(null);

const LIST_FILTER = { includeAttachments: false } as const;

function sortRecords(items: WorkRecordDTO[]): WorkRecordDTO[] {
  return [...items].sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime());
}

/** 内存数据缓存：启动预加载，Tab 切换即时展示。 */
export function DataStoreProvider({ children }: { children: ReactNode }) {
  const { ready, currentClassId, students, records, grades } = useAppContainer();
  const [studentsCache, setStudentsCache] = useState<StudentDTO[] | null>(null);
  const [recordsCache, setRecordsCache] = useState<WorkRecordDTO[] | null>(null);
  const [gradeSheetsCache, setGradeSheetsCache] = useState<GradeSheetDTO[] | null>(null);
  const [cacheClassId, setCacheClassId] = useState<string | null>(null);

  const studentsCacheRef = useRef(studentsCache);
  const recordsCacheRef = useRef(recordsCache);
  const gradeSheetsCacheRef = useRef(gradeSheetsCache);
  const cacheClassIdRef = useRef(cacheClassId);
  studentsCacheRef.current = studentsCache;
  recordsCacheRef.current = recordsCache;
  gradeSheetsCacheRef.current = gradeSheetsCache;
  cacheClassIdRef.current = cacheClassId;

  const invalidateAll = useCallback(() => {
    setStudentsCache(null);
    setRecordsCache(null);
    setGradeSheetsCache(null);
    setCacheClassId(null);
  }, []);

  const refreshStudents = useCallback(
    async (force = false) => {
      if (!currentClassId) return [];
      if (!force && studentsCacheRef.current && cacheClassIdRef.current === currentClassId) {
        return studentsCacheRef.current;
      }
      const data = await students.list(currentClassId);
      setStudentsCache(data);
      setCacheClassId(currentClassId);
      return data;
    },
    [currentClassId, students],
  );

  const refreshRecords = useCallback(
    async (force = false) => {
      if (!currentClassId) return [];
      if (!force && recordsCacheRef.current && cacheClassIdRef.current === currentClassId) {
        return recordsCacheRef.current;
      }
      const data = await records.list(currentClassId, LIST_FILTER);
      setRecordsCache(data);
      setCacheClassId(currentClassId);
      return data;
    },
    [currentClassId, records],
  );

  const refreshGradeSheets = useCallback(
    async (force = false) => {
      if (!currentClassId) return [];
      if (!force && gradeSheetsCacheRef.current && cacheClassIdRef.current === currentClassId) {
        return gradeSheetsCacheRef.current;
      }
      const data = await grades.listSheets(currentClassId);
      setGradeSheetsCache(data);
      setCacheClassId(currentClassId);
      return data;
    },
    [currentClassId, grades],
  );

  const upsertRecord = useCallback((record: WorkRecordDTO) => {
    setRecordsCache((prev) => {
      if (!prev) return [record];
      const idx = prev.findIndex((item) => item.id === record.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = record;
        return sortRecords(next);
      }
      return sortRecords([record, ...prev]);
    });
    if (currentClassId) setCacheClassId(currentClassId);
  }, [currentClassId]);

  const removeRecord = useCallback((id: string) => {
    setRecordsCache((prev) => (prev ? prev.filter((item) => item.id !== id) : null));
  }, []);

  useEffect(() => {
    if (!ready || !currentClassId) return;
    if (
      cacheClassIdRef.current === currentClassId &&
      studentsCacheRef.current &&
      recordsCacheRef.current &&
      gradeSheetsCacheRef.current
    ) {
      return;
    }

    let cancelled = false;
    void (async () => {
      const [studentRows, recordRows, sheetRows] = await Promise.all([
        students.list(currentClassId),
        records.list(currentClassId, LIST_FILTER),
        grades.listSheets(currentClassId),
      ]);
      if (cancelled) return;
      setStudentsCache(studentRows);
      setRecordsCache(recordRows);
      setGradeSheetsCache(sheetRows);
      setCacheClassId(currentClassId);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, currentClassId, students, records, grades]);

  const value = useMemo(
    () => ({
      students: studentsCache,
      records: recordsCache,
      gradeSheets: gradeSheetsCache,
      refreshStudents,
      refreshRecords,
      refreshGradeSheets,
      upsertRecord,
      removeRecord,
      invalidateAll,
    }),
    [
      studentsCache,
      recordsCache,
      gradeSheetsCache,
      refreshStudents,
      refreshRecords,
      refreshGradeSheets,
      upsertRecord,
      removeRecord,
      invalidateAll,
    ],
  );

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore(): DataStoreValue {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
