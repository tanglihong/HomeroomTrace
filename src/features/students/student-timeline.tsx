"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { AttendanceDTO, BehaviorPointDTO, WorkRecordDTO } from "@/domain/use-cases/repositories";
import { IOSEmpty } from "@/features/common/ios-list";
import { useAppContainer } from "@/lib/app-container";
import { formatRecordDate } from "@/lib/format";

interface StudentTimelineProps {
  studentId: string;
}

type TimelineKind = "record" | "behavior" | "parentComms";

interface TimelineEntry {
  id: string;
  kind: TimelineKind;
  date: Date;
  title: string;
  subtitle?: string;
  href?: string;
}

const KIND_LABELS: Record<TimelineKind, string> = {
  record: "留痕",
  behavior: "奖惩",
  parentComms: "家校沟通",
};

function mapBehavior(items: BehaviorPointDTO[]): TimelineEntry[] {
  return items.map((b) => ({
    id: `beh-${b.id}`,
    kind: "behavior" as const,
    date: b.date,
    title: `${b.delta > 0 ? "+" : ""}${b.delta} 分`,
    subtitle: b.reason,
  }));
}

function mapRecords(records: WorkRecordDTO[]): TimelineEntry[] {
  return records.map((r) => ({
    id: `rec-${r.id}`,
    kind: "record" as const,
    date: r.happenedAt,
    title: r.title,
    subtitle: r.content.slice(0, 80) || undefined,
    href: `/records/detail?id=${r.id}`,
  }));
}

function mapParentComms(
  comms: { id: string; date: Date; channel: string; summary: string }[],
): TimelineEntry[] {
  return comms.map((c) => ({
    id: `comm-${c.id}`,
    kind: "parentComms" as const,
    date: c.date,
    title: c.summary,
    subtitle: c.channel,
  }));
}

/** 合并留痕、奖惩、家校沟通，按日期倒序展示。 */
export function StudentTimeline({ studentId }: StudentTimelineProps) {
  const container = useAppContainer();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const classId = container.requireClassId();
      const [behavior, allRecords, comms] = await Promise.all([
        container.behavior.list(studentId),
        container.records.list(classId, { studentId, includeAttachments: false }),
        container.parentCommunications.list(studentId),
      ]);
      const merged = [
        ...mapRecords(allRecords),
        ...mapBehavior(behavior),
        ...mapParentComms(comms),
      ].sort((a, b) => b.date.getTime() - a.date.getTime());
      setEntries(merged);
    } finally {
      setLoading(false);
    }
  }, [container, studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const grouped = useMemo(() => {
    const map = new Map<string, TimelineEntry[]>();
    for (const entry of entries) {
      const key = formatRecordDate(entry.date).slice(0, 10);
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [entries]);

  if (loading) {
    return <IOSEmpty title="加载中…" />;
  }

  if (entries.length === 0) {
    return <IOSEmpty title="暂无动态" description="留痕、奖惩与家校沟通将显示在此" />;
  }

  return (
    <div className="student-timeline">
      {grouped.map(([day, dayEntries]) => (
        <section key={day} className="ios-section">
          <h3 className="ios-section-title">{day}</h3>
          <div className="ios-group">
            {dayEntries.map((entry) => {
              const inner = (
                <div className="record-row-main">
                  <div className="record-row-text">
                    <div className="record-row-title">{entry.title}</div>
                    <div className="record-subtitle">
                      {KIND_LABELS[entry.kind]}
                      {entry.subtitle ? ` · ${entry.subtitle}` : ""}
                    </div>
                  </div>
                </div>
              );
              if (entry.href) {
                return (
                  <Link key={entry.id} href={entry.href} className="ios-row has-chevron">
                    {inner}
                  </Link>
                );
              }
              return (
                <div key={entry.id} className="ios-row">
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
