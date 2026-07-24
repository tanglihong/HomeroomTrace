"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { ALL_WORK_RECORD_TYPES, RecordTypeConfig } from "@/domain/models/work-record-type";
import { RecordTypeIcon } from "@/features/common/icons";
import { IOSEmpty } from "@/features/common/ios-list";
import { IOSNavBar, IOSNavLink } from "@/features/common/ios-nav-bar";
import { useDataStore } from "@/lib/data-store";
import { recordRowSubtitle } from "@/lib/format";

export const WorkbenchView = memo(function WorkbenchView() {
  const { records } = useDataStore();
  const recent = useMemo(() => records?.slice(0, 10) ?? [], [records]);

  return (
    <>
      <IOSNavBar title="工作台" large right={<IOSNavLink href="/records">全部记录</IOSNavLink>} />
      <div className="page-content">
        <h2 className="page-section-title">快捷新建</h2>
        <div className="quick-grid">
          {ALL_WORK_RECORD_TYPES.map((type) => (
            <Link key={type} href={`/records/new?type=${type}`} prefetch className="quick-card">
              <RecordTypeIcon type={type} />
              <span className="quick-card-label">{RecordTypeConfig.configuration(type).displayName}</span>
            </Link>
          ))}
        </div>
        <h2 className="page-section-title">最近留痕</h2>
        {!records ? (
          <IOSEmpty title="加载中…" />
        ) : recent.length === 0 ? (
          <IOSEmpty title="暂无留痕" description="点击上方类型开始记录" />
        ) : (
          <div className="ios-group">
            {recent.map((item) => (
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
});
