"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { GradeSheetDTO } from "@/domain/use-cases/repositories";
import { IconChart } from "@/features/common/icons";
import { IOSEmpty } from "@/features/common/ios-list";
import { IOSNavBar, IOSNavLink } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useDataStore } from "@/lib/data-store";
import { formatRecordDate } from "@/lib/format";

export function GradesView() {
  const { gradeSheets, refreshGradeSheets } = useDataStore();
  const toast = useToast();
  const [sheets, setSheets] = useState<GradeSheetDTO[]>([]);

  useEffect(() => {
    if (gradeSheets) {
      setSheets(gradeSheets);
      return;
    }
    refreshGradeSheets()
      .then(setSheets)
      .catch((e) => toast.show(e instanceof Error ? e.message : "加载失败", true));
  }, [gradeSheets, refreshGradeSheets, toast]);

  return (
    <>
      <IOSNavBar title="成绩学情" large right={<IOSNavLink href="/grades/import">导入</IOSNavLink>} />
      <div className="page-content">
        {!gradeSheets && sheets.length === 0 ? (
          <IOSEmpty title="加载中…" />
        ) : sheets.length === 0 ? (
          <IOSEmpty title="暂无成绩表" description="导入 CSV 成绩" />
        ) : (
          <div className="ios-group">
            {sheets.map((s) => (
              <Link key={s.id} href={`/grades/${s.id}/insight`} prefetch className="ios-row has-chevron record-row">
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
}
