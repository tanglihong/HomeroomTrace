import { getDatabase } from "@/data/db/schema";

export interface MediaStorageStats {
  count: number;
  bytes: number;
}

type MediaStorageListener = () => void;

const mediaStorageListeners = new Set<MediaStorageListener>();

/** 订阅媒体存储变更（增删附件等）。 */
export function subscribeMediaStorageChanged(listener: MediaStorageListener): () => void {
  mediaStorageListeners.add(listener);
  return () => mediaStorageListeners.delete(listener);
}

/** 媒体文件写入或删除后通知订阅方刷新统计。 */
export function notifyMediaStorageChanged(): void {
  for (const listener of mediaStorageListeners) listener();
}

/** 统计 IndexedDB mediaFiles 表的文件数量与占用字节。 */
export async function getMediaStorageStats(): Promise<MediaStorageStats> {
  const rows = await getDatabase().mediaFiles.toArray();
  let bytes = 0;
  for (const row of rows) {
    bytes += row.blob.size;
  }
  return { count: rows.length, bytes };
}
