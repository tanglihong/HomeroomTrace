import JSZip from "jszip";
import { getDatabase } from "@/data/db/schema";

const DB_TABLES = [
  "classGroups",
  "students",
  "workRecords",
  "attachments",
  "gradeSheets",
  "gradeEntries",
  "attendances",
  "behaviorPoints",
  "recordTemplates",
  "parentCommunications",
] as const;

/** 本地备份与还原（JSON + 媒体 Blob）。 */
export const BackupService = {
  async exportBackup(): Promise<Blob> {
    const db = getDatabase();
    const zip = new JSZip();
    const storeFolder = zip.folder("Store")!;
    for (const table of DB_TABLES) {
      const rows = await (db[table] as { toArray: () => Promise<unknown[]> }).toArray();
      storeFolder.file(`${table}.json`, JSON.stringify(rows));
    }
    const mediaRows = await db.mediaFiles.toArray();
    const mediaFolder = zip.folder("Media")!;
    for (const row of mediaRows) {
      mediaFolder.file(row.relativePath.replace(/\//g, "__"), row.blob);
    }
    mediaFolder.file("_manifest.json", JSON.stringify(mediaRows.map((r) => ({ relativePath: r.relativePath, mimeType: r.mimeType }))));
    return zip.generateAsync({ type: "blob" });
  },

  async restoreBackup(file: File): Promise<void> {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const db = getDatabase();
    await db.transaction("rw", [...DB_TABLES, "mediaFiles"], async () => {
      for (const table of DB_TABLES) {
        const content = await zip.file(`Store/${table}.json`)?.async("string");
        if (!content) continue;
        const rows = JSON.parse(content) as unknown[];
        const tableRef = db[table] as unknown as { clear: () => Promise<void>; bulkAdd: (items: unknown[]) => Promise<unknown> };
        await tableRef.clear();
        if (rows.length > 0) await tableRef.bulkAdd(rows);
      }
      await db.mediaFiles.clear();
      const manifestRaw = await zip.file("Media/_manifest.json")?.async("string");
      if (manifestRaw) {
        const manifest = JSON.parse(manifestRaw) as { relativePath: string; mimeType: string }[];
        for (const item of manifest) {
          const blob = await zip.file(`Media/${item.relativePath.replace(/\//g, "__")}`)?.async("blob");
          if (blob) await db.mediaFiles.put({ relativePath: item.relativePath, blob, mimeType: item.mimeType });
        }
      }
    });
  },
};
