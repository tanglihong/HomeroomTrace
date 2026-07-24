import { useCallback, useEffect, useRef, useState } from "react";

/** 防抖 hook，减少搜索等高频触发的 DB 查询。 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

/** 稳定引用 callback，避免 useEffect 因依赖变化反复触发。 */
export function useStableCallback<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback(((...args: Parameters<T>) => ref.current(...args)) as T, []);
}

/** 保存/提交类异步操作：防重复提交 + 配合 LoadingOverlay */
export function useSavingAction(message = "保存中…") {
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const runSaving = useCallback(async (fn: () => Promise<void>): Promise<boolean> => {
    if (savingRef.current) return false;
    savingRef.current = true;
    setSaving(true);
    try {
      await fn();
      return true;
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, []);

  return { saving, runSaving, savingMessage: message };
}
