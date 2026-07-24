"use client";

import type { SubjectStats } from "@/domain/analysis/grade-analyzer";

interface GradeTrendChartProps {
  subjectStats: SubjectStats[];
}

/** 各科均分 CSS 柱状图（学情简报用）。 */
export function GradeTrendChart({ subjectStats }: GradeTrendChartProps) {
  if (subjectStats.length === 0) {
    return <p className="record-subtitle" style={{ padding: "12px 16px" }}>暂无成绩数据</p>;
  }

  const maxScore = Math.max(...subjectStats.map((s) => s.average), 100);

  return (
    <div className="grade-trend-chart">
      {subjectStats.map((s) => {
        const pct = maxScore > 0 ? (s.average / maxScore) * 100 : 0;
        return (
          <div key={s.subject} className="grade-trend-row">
            <span className="grade-trend-label">{s.subject}</span>
            <div className="grade-trend-bar-track">
              <div className="grade-trend-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="grade-trend-value">{s.average.toFixed(1)}</span>
          </div>
        );
      })}
    </div>
  );
}
