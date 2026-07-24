"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WorkRecordDTO } from "@/domain/use-cases/repositories";
import { RecordTypeConfig } from "@/domain/models/work-record-type";
import { useAppContainer } from "@/lib/app-container";
import { formatRecordDate } from "@/lib/format";

/** 工作台待跟进提醒：消息气泡样式 */
export function FollowUpBubbles() {
  const container = useAppContainer();
  const [items, setItems] = useState<WorkRecordDTO[]>([]);

  const reload = useCallback(async () => {
    try {
      const classId = container.requireClassId();
      const due = await container.records.listDueFollowUps(classId);
      setItems(due.slice(0, 5));
    } catch {
      setItems([]);
    }
  }, [container]);

  useEffect(() => {
    reload();
  }, [reload]);

  if (items.length === 0) return null;

  return (
    <section className="follow-up-section">
      <h2 className="page-section-title">待跟进</h2>
      <div className="follow-up-bubbles">
        {items.map((record) => (
          <Link
            key={record.id}
            href={`/records/detail?id=${record.id}`}
            className="follow-up-bubble"
            prefetch
          >
            <span className="follow-up-bubble-tag">
              {RecordTypeConfig.configuration(record.type).displayName}
            </span>
            <span className="follow-up-bubble-title">{record.title}</span>
            {record.followUp && <p className="follow-up-bubble-text">{record.followUp}</p>}
            {record.followUpDueAt && (
              <span className="follow-up-bubble-date">
                截止 {formatRecordDate(record.followUpDueAt).slice(0, 10)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
