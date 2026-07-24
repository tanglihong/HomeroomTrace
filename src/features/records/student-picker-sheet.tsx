"use client";

import { useEffect, useMemo, useState } from "react";
import type { StudentDTO } from "@/domain/use-cases/repositories";
import { PRESET_STUDENT_TAGS } from "@/lib/preset-tags";

interface StudentPickerSheetProps {
  open: boolean;
  students: StudentDTO[];
  selectedIds: string[];
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
}

export function StudentPickerSheet({ open, students, selectedIds, onClose, onConfirm }: StudentPickerSheetProps) {
  const [keyword, setKeyword] = useState("");
  const [draftIds, setDraftIds] = useState<string[]>(selectedIds);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraftIds(selectedIds);
    setKeyword("");
    setActiveTag(null);
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const filtered = useMemo(() => {
    let list = students;
    if (activeTag) {
      list = list.filter((s) => s.tags.includes(activeTag));
    }
    const q = keyword.trim();
    if (!q) return list;
    return list.filter((s) => s.name.includes(q) || s.studentNo.includes(q));
  }, [students, keyword, activeTag]);

  const toggle = (id: string) => {
    setDraftIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const confirm = () => {
    onConfirm(draftIds);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="ios-sheet-backdrop" role="presentation">
      <div className="ios-sheet ios-sheet-full" role="dialog" aria-modal="true" aria-labelledby="student-picker-title">
        <header className="ios-sheet-nav">
          <button type="button" className="ios-sheet-nav-btn" onClick={onClose}>
            取消
          </button>
          <h2 id="student-picker-title" className="ios-sheet-nav-title">
            选择学生
          </h2>
          <button type="button" className="ios-sheet-nav-btn ios-sheet-nav-btn-primary" onClick={confirm}>
            完成{draftIds.length > 0 ? `(${draftIds.length})` : ""}
          </button>
        </header>
        <div className="ios-sheet-search">
          <input
            type="search"
            placeholder="搜索姓名或学号"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
          />
        </div>
        <div className="tag-list" style={{ padding: "8px 16px", flexWrap: "wrap", display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`tag tag-chip ${activeTag === null ? "tag-chip-selected" : ""}`}
            onClick={() => setActiveTag(null)}
          >
            全部
          </button>
          {PRESET_STUDENT_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag tag-chip ${activeTag === tag ? "tag-chip-selected" : ""}`}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="ios-sheet-body">
          {students.length === 0 ? (
            <p className="ios-sheet-empty">请先在学生 Tab 添加名册</p>
          ) : filtered.length === 0 ? (
            <p className="ios-sheet-empty">未找到匹配学生</p>
          ) : (
            <div className="ios-group">
              {filtered.map((s) => {
                const checked = draftIds.includes(s.id);
                return (
                  <button key={s.id} type="button" className="ios-picker-row" onClick={() => toggle(s.id)}>
                    <span className="ios-picker-row-text">
                      {s.name}
                      <span className="record-subtitle"> · {s.studentNo}</span>
                    </span>
                    {checked && <span className="ios-picker-check">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
