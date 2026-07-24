"use client";

import Link from "next/link";
import { memo } from "react";
import { IconChart } from "@/features/common/icons";
import { IOSEmpty } from "@/features/common/ios-list";
import { IOSNavBar, IOSNavLink } from "@/features/common/ios-nav-bar";
import { useDataStore } from "@/lib/data-store";
import { formatRecordDate } from "@/lib/format";

export const GradesView = memo(function GradesView() {
  const { gradeSheets } = useDataStore();
  const sheets = gradeSheets ?? [];

  return (
    <>
      <IOSNavBar title="成绩学情" large right={<IOSNavLink href="/grades/import">导入</IOSNavLink>} />
      <div className="page-content">
        {!gradeSheets ? (
          <IOSEmpty title="加载中…" />
        ) : sheets.length === 0 ? (
          <IOSEmpty title="暂无成绩表" description="导入 CSV 成绩" />
        ) : (
          <div className="ios-group">
            {sheets.map((s) => (
              <Link key={s.id} href={`/grades/insight?id=${s.id}`} prefetch className="ios-row has-chevron record-row">
                <div className="record-row-main">
                  <span className="record-type-icon" style={{ background: "rgba(52,199,89,0.12)", color: "#34C759" }}>
                    <IconChart size={20} />
                  </span>
                  <div className="record-row-text">
                    <div className="record-row-title">{s.examName}</div>
                    <div className="record-subtitle">
                      {formatRecordDate(s.examDate)} · {s.subjectNames.join("、")}
                    </div>
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
