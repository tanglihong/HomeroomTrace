"use client";

import Link from "next/link";
import { memo, useMemo } from "react";
import { ALL_WORK_RECORD_TYPES, RecordTypeConfig, type WorkRecordType } from "@/domain/models/work-record-type";
import { RecordTypeIcon } from "@/features/common/icons";
import { IOSEmpty } from "@/features/common/ios-list";
import { IOSNavBar, IOSNavLink } from "@/features/common/ios-nav-bar";
import { FollowUpBubbles } from "@/features/workbench/follow-up-bubbles";
import { RecordListGroup } from "@/features/records/record-list-group";
import { getRecentRecordTypes } from "@/lib/app-preferences";
import { useDataStore } from "@/lib/data-store";

function orderedQuickTypes(): WorkRecordType[] {
  const recent = getRecentRecordTypes();
  const rest = ALL_WORK_RECORD_TYPES.filter((type) => !recent.includes(type));
  return [...recent, ...rest];
}

export const WorkbenchView = memo(function WorkbenchView() {
  const { records } = useDataStore();
  const recent = useMemo(() => records?.slice(0, 10) ?? [], [records]);
  const quickTypes = useMemo(() => orderedQuickTypes(), []);

  return (
    <>
      <IOSNavBar title="工作台" large right={<IOSNavLink href="/records">全部记录</IOSNavLink>} />
      <div className="page-content">
        <FollowUpBubbles />
        <h2 className="page-section-title">快捷新建</h2>
        <div className="quick-grid">
          {quickTypes.map((type) => (
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
          <RecordListGroup records={recent} />
        )}
      </div>
    </>
  );
});
