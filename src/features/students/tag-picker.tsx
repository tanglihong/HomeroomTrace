"use client";

import { useCallback, useState } from "react";
import { PRESET_STUDENT_TAGS } from "@/lib/preset-tags";

interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
}

/** 预设标签 + 自定义输入的多选 Chip 组件。 */
export function TagPicker({ value, onChange, disabled }: TagPickerProps) {
  const [customInput, setCustomInput] = useState("");

  const toggle = useCallback(
    (tag: string) => {
      if (disabled) return;
      if (value.includes(tag)) {
        onChange(value.filter((t) => t !== tag));
      } else {
        onChange([...value, tag]);
      }
    },
    [disabled, onChange, value],
  );

  const addCustom = () => {
    const tag = customInput.trim();
    if (!tag || value.includes(tag)) {
      setCustomInput("");
      return;
    }
    onChange([...value, tag]);
    setCustomInput("");
  };

  return (
    <div className="tag-picker">
      <div className="tag-list">
        {PRESET_STUDENT_TAGS.map((tag) => {
          const selected = value.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              className={`tag tag-chip ${selected ? "tag-chip-selected" : ""}`}
              onClick={() => toggle(tag)}
              disabled={disabled}
            >
              {tag}
            </button>
          );
        })}
        {value
          .filter((t) => !(PRESET_STUDENT_TAGS as readonly string[]).includes(t))
          .map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag tag-chip tag-chip-selected"
              onClick={() => toggle(tag)}
              disabled={disabled}
            >
              {tag} ×
            </button>
          ))}
      </div>
      <div className="tag-picker-input-row">
        <input
          type="text"
          placeholder="自定义标签"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          disabled={disabled}
        />
        <button type="button" className="ios-btn ios-btn-tinted" onClick={addCustom} disabled={disabled || !customInput.trim()}>
          添加
        </button>
      </div>
    </div>
  );
}
