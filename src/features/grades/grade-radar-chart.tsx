"use client";

interface RadarPoint {
  subject: string;
  score: number;
  classAvg: number;
}

interface GradeRadarChartProps {
  data: RadarPoint[];
  title?: string;
}

/** 偏科雷达图：学生各科 vs 班级均分 */
export function GradeRadarChart({ data, title }: GradeRadarChartProps) {
  if (data.length < 3) {
    return <p className="record-subtitle" style={{ padding: "12px 16px" }}>科目不足，无法绘制雷达图</p>;
  }

  const n = data.length;
  const cx = 120;
  const cy = 120;
  const r = 90;
  const maxVal = Math.max(...data.flatMap((d) => [d.score, d.classAvg]), 100);

  const angle = (i: number) => ((Math.PI * 2) / n) * i - Math.PI / 2;
  const toXY = (val: number, i: number) => {
    const ratio = maxVal > 0 ? val / maxVal : 0;
    return { x: cx + r * ratio * Math.cos(angle(i)), y: cy + r * ratio * Math.sin(angle(i)) };
  };

  const scorePath = data
    .map((_, i) => {
      const { x, y } = toXY(data[i].score, i);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ") + " Z";

  const avgPath = data
    .map((_, i) => {
      const { x, y } = toXY(data[i].classAvg, i);
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ") + " Z";

  return (
    <div className="grade-radar-chart">
      {title && <p className="grade-radar-title">{title}</p>}
      <svg viewBox="0 0 240 240" className="grade-radar-svg" role="img" aria-label={title ?? "偏科雷达图"}>
        {[0.25, 0.5, 0.75, 1].map((level) => (
          <polygon
            key={level}
            points={data
              .map((_, i) => {
                const { x, y } = toXY(maxVal * level, i);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="rgba(60,60,67,0.15)"
            strokeWidth="1"
          />
        ))}
        {data.map((d, i) => {
          const outer = toXY(maxVal, i);
          return (
            <g key={d.subject}>
              <line x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="rgba(60,60,67,0.12)" />
              <text
                x={toXY(maxVal * 1.12, i).x}
                y={toXY(maxVal * 1.12, i).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="10"
                fill="#8e8e93"
              >
                {d.subject.length > 4 ? `${d.subject.slice(0, 3)}…` : d.subject}
              </text>
            </g>
          );
        })}
        <path d={avgPath} fill="rgba(142,142,147,0.2)" stroke="#8e8e93" strokeWidth="1.5" />
        <path d={scorePath} fill="rgba(181,131,141,0.25)" stroke="#B5838D" strokeWidth="2" />
      </svg>
      <div className="grade-radar-legend">
        <span><i className="grade-radar-dot score" /> 该生</span>
        <span><i className="grade-radar-dot avg" /> 班均</span>
      </div>
    </div>
  );
}
