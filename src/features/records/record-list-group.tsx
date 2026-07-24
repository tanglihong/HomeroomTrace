"use client";

import { useCallback, useState } from "react";
import type { WorkRecordDTO } from "@/domain/use-cases/repositories";
import { RecordTypeIcon } from "@/features/common/icons";
import { useToast } from "@/features/common/toast";
import { useIOSAlert } from "@/features/common/ios-alert";
import { showUndoToast } from "@/features/common/undo-toast";
import { SwipeableRecordRow } from "@/features/records/swipeable-record-row";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";
import { recordRowSubtitle } from "@/lib/format";
import { cancelPendingDelete, schedulePendingDelete } from "@/lib/pending-delete";

interface RecordListGroupProps {
  records: WorkRecordDTO[];
  onDeleted?: (id: string) => void;
}

export function RecordListGroup({ records, onDeleted }: RecordListGroupProps) {
  const container = useAppContainer();
  const { removeRecord, upsertRecord } = useDataStore();
  const toast = useToast();
  const { confirm } = useIOSAlert();
  const [openId, setOpenId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await confirm({
        title: "确定删除这条留痕？",
        message: "删除后可在 5 秒内撤销",
        confirmLabel: "删除",
        destructive: true,
      });
      if (!ok) return;
      try {
        const record = await container.records.find(id);
        if (!record) return;
        removeRecord(id);
        onDeleted?.(id);
        setOpenId(null);
        schedulePendingDelete(
          id,
          () => {
            void container.records.delete(id);
          },
          () => {
            void container.records.restore(record).then(() => {
              upsertRecord(record);
            });
          },
        );
        showUndoToast(toast, "已删除", () => {
          cancelPendingDelete(id);
        });
      } catch (e) {
        toast.show(e instanceof Error ? e.message : "删除失败", true);
      }
    },
    [container.records, removeRecord, upsertRecord, onDeleted, toast, confirm],
  );

  return (
    <div className="ios-group ios-group-swipe">
      {records.map((item) => (
        <SwipeableRecordRow
          key={item.id}
          record={item}
          href={`/records/detail?id=${item.id}`}
          open={openId === item.id}
          onOpen={() => setOpenId(item.id)}
          onClose={() => setOpenId((current) => (current === item.id ? null : current))}
          onDelete={handleDelete}
        >
          <div className="record-row-main">
            <RecordTypeIcon type={item.type} size={18} />
            <div className="record-row-text">
              <div className="record-row-title">{item.title}</div>
              <div className="record-subtitle">{recordRowSubtitle(item)}</div>
            </div>
          </div>
        </SwipeableRecordRow>
      ))}
    </div>
  );
}
