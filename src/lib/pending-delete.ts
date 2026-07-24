const DEFAULT_MS = 5000;

interface PendingEntry {
  timerId: ReturnType<typeof setTimeout>;
  onFinalize: () => void;
  onRestore: () => void;
}

const pending = new Map<string, PendingEntry>();

/** 延迟删除：5 秒内可撤销，超时后执行 onFinalize。 */
export function schedulePendingDelete(
  id: string,
  onFinalize: () => void,
  onRestore: () => void,
  ms = DEFAULT_MS,
): void {
  cancelPendingDelete(id);
  const timerId = setTimeout(() => {
    pending.delete(id);
    onFinalize();
  }, ms);
  pending.set(id, { timerId, onFinalize, onRestore });
}

/** 撤销待删除项，恢复数据并取消定时器。 */
export function cancelPendingDelete(id: string): boolean {
  const entry = pending.get(id);
  if (!entry) return false;
  clearTimeout(entry.timerId);
  pending.delete(id);
  entry.onRestore();
  return true;
}

/** 是否仍在撤销窗口内。 */
export function isPendingDelete(id: string): boolean {
  return pending.has(id);
}
