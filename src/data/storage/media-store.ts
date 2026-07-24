import type { MediaStore } from "@/domain/use-cases/repositories";
import { getDatabase } from "@/data/db/schema";
import { v4 as uuidv4 } from "uuid";

/** IndexedDB 媒体文件存储。 */
export class IndexedDBMediaStore implements MediaStore {
  async save(data: Blob, ownerFolder: string, fileExtension: string): Promise<string> {
    const relativePath = `${ownerFolder}/${uuidv4()}.${fileExtension}`;
    const db = getDatabase();
    await db.mediaFiles.put({
      relativePath,
      blob: data,
      mimeType: data.type || "application/octet-stream",
    });
    return relativePath;
  }

  async get(relativePath: string): Promise<Blob | undefined> {
    const row = await getDatabase().mediaFiles.get(relativePath);
    return row?.blob;
  }

  async url(relativePath: string): Promise<string> {
    const row = await getDatabase().mediaFiles.get(relativePath);
    if (!row) throw new Error("媒体文件不存在");
    const mimeType = row.blob.type || row.mimeType || "application/octet-stream";
    const blob = row.blob.type ? row.blob : new Blob([row.blob], { type: mimeType });
    return URL.createObjectURL(blob);
  }

  async delete(relativePath: string): Promise<void> {
    await getDatabase().mediaFiles.delete(relativePath);
  }
}
