"use client";

import { useCallback, useEffect, useState } from "react";
import type { BehaviorPointDTO } from "@/domain/use-cases/repositories";
import { IOSSection, LoadingOverlay } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";
import { formatRecordDate, toDateInputValue } from "@/lib/format";
import { useSavingAction } from "@/lib/hooks";

interface BehaviorPageClientProps {
  studentId: string;
}

export default function BehaviorPageClient({ studentId: id }: BehaviorPageClientProps) {
  const container = useAppContainer();
  const { upsertRecord } = useDataStore();
  const toast = useToast();
  const { saving, runSaving, savingMessage } = useSavingAction("登记中…");
  const [list, setList] = useState<BehaviorPointDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState("");
  const [alsoRecord, setAlsoRecord] = useState(false);

  const reload = useCallback(async () => {
    const items = await container.behavior.list(id);
    setList(items);
    setTotal(items.reduce((sum, item) => sum + item.delta, 0));
  }, [container, id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = async () => {
    if (!reason.trim()) {
      toast.show("请填写原因", true);
      return;
    }
    try {
      await runSaving(async () => {
        const happenedAt = new Date(`${date}T12:00:00`);
        let linkedRecordId: string | undefined;
        if (alsoRecord) {
          linkedRecordId = await container.records.add({
            classId: container.requireClassId(),
            type: "behaviorNote",
            title: `奖惩-${reason.trim()}`,
            happenedAt,
            studentIds: [id],
            content: `${delta > 0 ? "+" : ""}${delta} 分：${reason.trim()}`,
            attachments: [],
          });
          const saved = await container.records.find(linkedRecordId);
          if (saved) upsertRecord(saved);
        }
        await container.behavior.add(id, happenedAt, delta, reason.trim(), linkedRecordId);
        setReason("");
        await reload();
        toast.show(alsoRecord ? "已登记并生成留痕" : "已登记");
      });
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "登记失败", true);
    }
  };

  return (
    <>
      <LoadingOverlay show={saving} message={savingMessage} />
      <IOSNavBar
        title="奖惩积分"
        backHref={`/students/detail?id=${id}`}
        right={
          <button type="button" onClick={add} disabled={saving}>
            {saving ? "登记中" : "登记"}
          </button>
        }
      />
      <div className="page-content">
        <p style={{ textAlign: "center", fontSize: 28, fontWeight: 600 }}>{total} 分</p>
        <IOSSection title="新增">
          <div className="form-field"><label>日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={saving} /></div>
          <div className="form-field"><label>分值（可负）</label><input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} disabled={saving} /></div>
          <div className="form-field"><label>原因</label><input value={reason} onChange={(e) => setReason(e.target.value)} disabled={saving} /></div>
          <label className="ios-row" style={{ margin: "0 16px", display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={alsoRecord} onChange={(e) => setAlsoRecord(e.target.checked)} disabled={saving} />
            同时生成留痕
          </label>
        </IOSSection>
        <IOSSection title="明细">
          {list.map((b) => (
            <div key={b.id} className="ios-row">
              <div>
                {formatRecordDate(b.date)} · {b.delta > 0 ? "+" : ""}
                {b.delta}
              </div>
              <div className="record-subtitle">{b.reason}</div>
            </div>
          ))}
        </IOSSection>
      </div>
    </>
  );
}
