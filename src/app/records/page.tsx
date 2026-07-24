"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ALL_WORK_RECORD_TYPES, RecordTypeConfig } from "@/domain/models/work-record-type";
import type { WorkRecordDTO, WorkRecordFilter } from "@/domain/use-cases/repositories";
import { IOSEmpty } from "@/features/common/ios-list";
import { IOSNavBar, IOSNavLink } from "@/features/common/ios-nav-bar";
import { RecordListGroup } from "@/features/records/record-list-group";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";
import { useDebouncedValue } from "@/lib/hooks";

function RecordListInner() {
  const container = useAppContainer();
  const { records: cachedRecords } = useDataStore();
  const toast = useToast();
  const searchParams = useSearchParams();
  const studentId = searchParams.get("studentId") ?? undefined;
  const [filteredRecords, setFilteredRecords] = useState<WorkRecordDTO[] | null>(null);
  const [filter, setFilter] = useState<WorkRecordFilter>({});
  const [keyword, setKeyword] = useState("");
  const [hasAttachmentOnly, setHasAttachmentOnly] = useState(false);
  const debouncedKeyword = useDebouncedValue(keyword, 300);

  const queryFilter = useMemo(
    () => ({
      ...filter,
      studentId,
      keyword: debouncedKeyword || undefined,
      hasAttachment: hasAttachmentOnly || undefined,
    }),
    [filter, studentId, debouncedKeyword, hasAttachmentOnly],
  );

  const hasExtraFilter = Boolean(
    queryFilter.type ||
      queryFilter.startDate ||
      queryFilter.endDate ||
      queryFilter.keyword ||
      queryFilter.studentId ||
      queryFilter.hasAttachment,
  );

  const records = useMemo(() => {
    if (hasExtraFilter) return filteredRecords ?? [];
    return cachedRecords ?? [];
  }, [hasExtraFilter, filteredRecords, cachedRecords]);

  const handleDeleted = useCallback(
    (id: string) => {
      if (hasExtraFilter) {
        setFilteredRecords((prev) => prev?.filter((item) => item.id !== id) ?? null);
      }
    },
    [hasExtraFilter],
  );

  useEffect(() => {
    if (!hasExtraFilter) {
      setFilteredRecords(null);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const classId = container.requireClassId();
        const data = await container.records.list(classId, queryFilter);
        if (!cancelled) setFilteredRecords(data);
      } catch (e) {
        if (!cancelled) toast.show(e instanceof Error ? e.message : "加载失败", true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [container, hasExtraFilter, queryFilter, toast]);

  return (
    <>
      <IOSNavBar title="全部留痕" backHref="/workbench" right={<IOSNavLink href="/records/new">新建</IOSNavLink>} />
      <div className="filter-bar">
        <select
          value={filter.type ?? ""}
          onChange={(e) => setFilter((f) => ({ ...f, type: (e.target.value || undefined) as WorkRecordFilter["type"] }))}
        >
          <option value="">全部类型</option>
          {ALL_WORK_RECORD_TYPES.map((t) => (
            <option key={t} value={t}>
              {RecordTypeConfig.configuration(t).displayName}
            </option>
          ))}
        </select>
        <input type="search" placeholder="搜索标题/内容" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
      </div>
      <label className="ios-row" style={{ margin: "0 16px 8px", display: "flex", gap: 8, alignItems: "center" }}>
        <input type="checkbox" checked={hasAttachmentOnly} onChange={(e) => setHasAttachmentOnly(e.target.checked)} />
        仅有附件
      </label>
      <div className="page-content">
        {!cachedRecords && records.length === 0 ? (
          <IOSEmpty title="加载中…" />
        ) : records.length === 0 ? (
          <IOSEmpty title="暂无留痕" description="点击右上角新建" />
        ) : (
          <RecordListGroup records={records} onDeleted={handleDeleted} />
        )}
      </div>
    </>
  );
}

export default function RecordListPage() {
  return (
    <Suspense>
      <RecordListInner />
    </Suspense>
  );
}
