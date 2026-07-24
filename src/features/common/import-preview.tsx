"use client";

import { useMemo } from "react";

interface ImportPreviewProps {
  rows: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

function parseRow(line: string): string[] {
  return line.split(/[,，\t]/).map((cell) => cell.trim());
}

/** 导入前预览表格，确认后再写入。 */
export function ImportPreview({ rows, onConfirm, onCancel }: ImportPreviewProps) {
  const { headers, body } = useMemo(() => {
    if (rows.length === 0) return { headers: [] as string[], body: [] as string[][] };
    const parsed = rows.map(parseRow);
    return { headers: parsed[0] ?? [], body: parsed.slice(1) };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="ios-empty">
        <p className="ios-empty-title">无预览数据</p>
      </div>
    );
  }

  return (
    <>
      <div className="ios-group" style={{ overflowX: "auto" }}>
        <table className="import-preview-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={`${h}-${i}`}>{h || `列 ${i + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {headers.map((_, ci) => (
                  <td key={ci}>{row[ci] ?? ""}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ios-section-footer" style={{ marginTop: 8 }}>
        共 {body.length} 行数据，请确认后导入
      </p>
      <div style={{ display: "flex", gap: 12, padding: "0 16px", marginTop: 16 }}>
        <button type="button" className="ios-btn ios-btn-tinted" style={{ flex: 1 }} onClick={onCancel}>
          取消
        </button>
        <button type="button" className="ios-btn ios-btn-filled" style={{ flex: 1 }} onClick={onConfirm}>
          确认导入
        </button>
      </div>
    </>
  );
}
