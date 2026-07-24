"use client";

interface LineSeries {
  label: string;
  points: { x: string; y: number }[];
  color?: string;
}

interface GradeLineChartProps {
  series: LineSeries[];
  yMax?: number;
}

const COLORS = ["#B5838D", "#34C759", "#FF9500", "#AF52DE", "#E07373"];

/** 简易折线图：班级/个体跨考趋势 */
export function GradeLineChart({ series, yMax }: GradeLineChartProps) {
  if (series.length === 0 || series.every((s) => s.points.length === 0)) {
    return <p className="record-subtitle" style={{ padding: "12px 16px" }}>需要至少两次考试数据</p>;
  }

  const allY = series.flatMap((s) => s.points.map((p) => p.y));
  const max = yMax ?? Math.max(...allY, 100);
  const labels = series[0]?.points.map((p) => p.x) ?? [];

  return (
    <div className="grade-line-chart">
      <div className="grade-line-legend">
        {series.map((s, i) => (
          <span key={s.label} className="grade-line-legend-item">
            <span className="grade-line-dot" style={{ background: s.color ?? COLORS[i % COLORS.length] }} />
            {s.label}
          </span>
        ))}
      </div>
      <div className="grade-line-plot">
        {labels.map((label, xi) => (
          <div key={label} className="grade-line-column">
            <div className="grade-line-dots">
              {series.map((s, si) => {
                const pt = s.points[xi];
                if (!pt) return null;
                const bottom = max > 0 ? (pt.y / max) * 100 : 0;
                return (
                  <span
                    key={s.label}
                    className="grade-line-point"
                    style={{ bottom: `${bottom}%`, background: s.color ?? COLORS[si % COLORS.length] }}
                    title={`${s.label}: ${pt.y.toFixed(1)}`}
                  />
                );
              })}
            </div>
            <span className="grade-line-x-label">{label.length > 6 ? `${label.slice(0, 5)}…` : label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
