"use client";



import Link from "next/link";

import { Suspense, useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { ALL_WORK_RECORD_TYPES, RecordTypeConfig } from "@/domain/models/work-record-type";

import type { WorkRecordDTO, WorkRecordFilter } from "@/domain/use-cases/repositories";

import { RecordTypeIcon } from "@/features/common/icons";

import { IOSEmpty } from "@/features/common/ios-list";

import { IOSNavBar, IOSNavLink } from "@/features/common/ios-nav-bar";

import { useToast } from "@/features/common/toast";

import { useAppContainer } from "@/lib/app-container";

import { useDataStore } from "@/lib/data-store";

import { useDebouncedValue } from "@/lib/hooks";

import { recordRowSubtitle } from "@/lib/format";



function RecordListInner() {

  const container = useAppContainer();

  const { records: cachedRecords } = useDataStore();

  const toast = useToast();

  const searchParams = useSearchParams();

  const studentId = searchParams.get("studentId") ?? undefined;

  const [filteredRecords, setFilteredRecords] = useState<WorkRecordDTO[] | null>(null);

  const [filter, setFilter] = useState<WorkRecordFilter>({});

  const [keyword, setKeyword] = useState("");

  const debouncedKeyword = useDebouncedValue(keyword, 300);



  const queryFilter = useMemo(

    () => ({ ...filter, studentId, keyword: debouncedKeyword || undefined }),

    [filter, studentId, debouncedKeyword],

  );



  const hasExtraFilter = Boolean(

    queryFilter.type || queryFilter.startDate || queryFilter.endDate || queryFilter.keyword || queryFilter.studentId,

  );



  const records = useMemo(() => {

    if (hasExtraFilter) return filteredRecords ?? [];

    return cachedRecords ?? [];

  }, [hasExtraFilter, filteredRecords, cachedRecords]);



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

      <div className="page-content">

        {!cachedRecords && records.length === 0 ? (

          <IOSEmpty title="加载中…" />

        ) : records.length === 0 ? (

          <IOSEmpty title="暂无留痕" description="点击右上角新建" />

        ) : (

          <div className="ios-group">

            {records.map((item) => (

              <Link key={item.id} href={`/records/detail?id=${item.id}`} prefetch className="ios-row has-chevron record-row">

                <div className="record-row-main">

                  <RecordTypeIcon type={item.type} size={18} />

                  <div className="record-row-text">

                    <div className="record-row-title">{item.title}</div>

                    <div className="record-subtitle">{recordRowSubtitle(item)}</div>

                  </div>

                </div>

              </Link>

            ))}

          </div>

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

