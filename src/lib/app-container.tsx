"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  DexieAttendanceRepository,
  DexieBehaviorRepository,
  DexieClassRepository,
  DexieGradeRepository,
  DexieParentCommunicationRepository,
  DexieStudentRepository,
  DexieTemplateRepository,
  DexieWorkRecordRepository,
} from "@/data/repositories";
import { IndexedDBMediaStore } from "@/data/storage/media-store";
import type {
  AttendanceRepository,
  BehaviorRepository,
  ClassRepository,
  GradeRepository,
  MediaStore,
  ParentCommunicationRepository,
  StudentRepository,
  TemplateRepository,
  WorkRecordRepository,
} from "@/domain/use-cases/repositories";
import { RepositoryError } from "@/domain/use-cases/repositories";

const ACTIVE_CLASS_STORAGE_KEY = "ht-active-class-id";

export interface AppContainerValue {
  ready: boolean;
  currentClassId: string | null;
  setCurrentClassId: (id: string) => void;
  classRepository: ClassRepository;
  students: StudentRepository;
  records: WorkRecordRepository;
  grades: GradeRepository;
  attendance: AttendanceRepository;
  behavior: BehaviorRepository;
  templates: TemplateRepository;
  parentCommunications: ParentCommunicationRepository;
  mediaStore: MediaStore;
  requireClassId: () => string;
}

const AppContainerContext = createContext<AppContainerValue | null>(null);

const CONTAINER_REPOS = (() => {
  const mediaStore = new IndexedDBMediaStore();
  return {
    classRepository: new DexieClassRepository(),
    students: new DexieStudentRepository(),
    records: new DexieWorkRecordRepository(mediaStore),
    grades: new DexieGradeRepository(),
    attendance: new DexieAttendanceRepository(),
    behavior: new DexieBehaviorRepository(),
    templates: new DexieTemplateRepository(),
    parentCommunications: new DexieParentCommunicationRepository(),
    mediaStore,
  };
})();

/** 依赖注入容器：组装 Data 实现供 Features 使用。 */
export function AppContainerProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [currentClassId, setCurrentClassIdState] = useState<string | null>(null);

  const setCurrentClassId = useCallback((id: string) => {
    setCurrentClassIdState(id);
    try {
      localStorage.setItem(ACTIVE_CLASS_STORAGE_KEY, id);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await CONTAINER_REPOS.templates.seedDefaultsIfNeeded();
        const list = await CONTAINER_REPOS.classRepository.list();
        if (cancelled) return;
        const savedId = (() => {
          try {
            return localStorage.getItem(ACTIVE_CLASS_STORAGE_KEY);
          } catch {
            return null;
          }
        })();
        if (savedId && list.some((c) => c.id === savedId)) {
          setCurrentClassId(savedId);
        } else if (list.length > 0) {
          setCurrentClassId(list[0].id);
        } else {
          const created = await CONTAINER_REPOS.classRepository.add("默认班级", "本学期");
          setCurrentClassId(created.id);
        }
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setCurrentClassId]);

  const requireClassId = useCallback(() => {
    if (!currentClassId) throw RepositoryError.invalidClass();
    return currentClassId;
  }, [currentClassId]);

  const value = useMemo<AppContainerValue>(
    () => ({
      ready,
      currentClassId,
      setCurrentClassId,
      ...CONTAINER_REPOS,
      requireClassId,
    }),
    [ready, currentClassId, setCurrentClassId, requireClassId],
  );

  return <AppContainerContext.Provider value={value}>{children}</AppContainerContext.Provider>;
}

export function useAppContainer(): AppContainerValue {
  const ctx = useContext(AppContainerContext);
  if (!ctx) throw new Error("useAppContainer must be used within AppContainerProvider");
  return ctx;
}
