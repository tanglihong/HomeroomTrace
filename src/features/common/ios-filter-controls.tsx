"use client";

import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";

/** iOS 风格下拉框：隐藏原生箭头，使用自定义 chevron */
export function IOSSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return (
    <div className="ios-select-wrap">
      <select className={`ios-select ${className}`.trim()} {...rest} />
    </div>
  );
}

interface IOSCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
}

/** iOS 风格复选框：自定义方框与勾选态 */
export function IOSCheckbox({ label, className = "", id, ...rest }: IOSCheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <label className={`ios-filter-check ${className}`.trim()} htmlFor={inputId}>
      <input type="checkbox" id={inputId} className="ios-filter-check-input" {...rest} />
      <span className="ios-filter-check-box" aria-hidden="true" />
      <span className="ios-filter-check-label">{label}</span>
    </label>
  );
}
