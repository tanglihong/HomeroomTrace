import { getDatabase } from "@/data/db/schema";

export interface MediaStorageStats {
  count: number;
  bytes: number;
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
