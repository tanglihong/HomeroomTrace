"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  invalidateAll: () => void;
}

const DataStoreContext = createContext<DataStoreValue | null>(null);

/** 内存数据缓存：启动预加载，Tab 切换即时展示。 */
export function DataStoreProvider({ children }: { children: ReactNode }) {
  const { ready, currentClassId, students, records, grades } = useAppContainer();
  const [studentsCache, setStudentsCache] = useState<StudentDTO[] | null>(null);
  const [recordsCache, setRecordsCache] = useState<WorkRecordDTO[] | null>(null);
  const [gradeSheetsCache, setGradeSheetsCache] = useState<GradeSheetDTO[] | null>(null);
  const [cacheClassId, setCacheClassId] = useState<string | null>(null);

  const invalidateAll = useCallback(() => {
    setStudentsCache(null);
    setRecordsCache(null);
    setGradeSheetsCache(null);
    setCacheClassId(null);
  }, []);

  const refreshStudents = useCallback(
    async (force = false) => {
      if (!currentClassId) return [];
      if (!force && studentsCache && cacheClassId === currentClassId) return studentsCache;
      const data = await students.list(currentClassId);
      setStudentsCache(data);
      setCacheClassId(currentClassId);
      return data;
    },
    [currentClassId, cacheClassId, students, studentsCache],
  );

  const refreshRecords = useCallback(
    async (force = false) => {
      if (!currentClassId) return [];
      if (!force && recordsCache && cacheClassId === currentClassId) return recordsCache;
      const data = await records.list(currentClassId, {});
      setRecordsCache(data);
      setCacheClassId(currentClassId);
      return data;
    },
    [currentClassId, cacheClassId, records, recordsCache],
  );

  const refreshGradeSheets = useCallback(
    async (force = false) => {
      if (!currentClassId) return [];
      if (!force && gradeSheetsCache && cacheClassId === currentClassId) return gradeSheetsCache;
      const data = await grades.listSheets(currentClassId);
      setGradeSheetsCache(data);
      setCacheClassId(currentClassId);
      return data;
    },
    [currentClassId, cacheClassId, grades, gradeSheetsCache],
  );

  useEffect(() => {
    if (!ready || !currentClassId) return;
    if (cacheClassId === currentClassId && studentsCache && recordsCache && gradeSheetsCache) return;

    let cancelled = false;
    void (async () => {
      const [s, r, g] = await Promise.all([
        students.list(currentClassId),
        records.list(currentClassId, {}),
        grades.listSheets(currentClassId),
      ]);
      if (cancelled) return;
      setStudentsCache(s);
      setRecordsCache(r);
      setGradeSheetsCache(g);
      setCacheClassId(currentClassId);
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, currentClassId, cacheClassId, studentsCache, recordsCache, gradeSheetsCache, students, records, grades]);

  const value = useMemo(
    () => ({
      students: studentsCache,
      records: recordsCache,
      gradeSheets: gradeSheetsCache,
      refreshStudents,
      refreshRecords,
      refreshGradeSheets,
      invalidateAll,
    }),
    [studentsCache, recordsCache, gradeSheetsCache, refreshStudents, refreshRecords, refreshGradeSheets, invalidateAll],
  );

  return <DataStoreContext.Provider value={value}>{children}</DataStoreContext.Provider>;
}

export function useDataStore(): DataStoreValue {
  const ctx = useContext(DataStoreContext);
  if (!ctx) throw new Error("useDataStore must be used within DataStoreProvider");
  return ctx;
}
