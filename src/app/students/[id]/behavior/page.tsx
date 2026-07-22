"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { BehaviorPointDTO } from "@/domain/use-cases/repositories";
import { IOSSection } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { formatRecordDate, toDateInputValue } from "@/lib/format";

export default function BehaviorPage() {
  const { id } = useParams<{ id: string }>();
  const container = useAppContainer();
  const toast = useToast();
  const [list, setList] = useState<BehaviorPointDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [delta, setDelta] = useState(1);
  const [reason, setReason] = useState("");

  const reload = useCallback(async () => {
    setList(await container.behavior.list(id));
    setTotal(await container.behavior.totalPoints(id));
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
      await container.behavior.add(id, new Date(`${date}T12:00:00`), delta, reason);
      setReason("");
      await reload();
      toast.show("已登记");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "登记失败", true);
    }
  };

  return (
    <>
      <IOSNavBar title="奖惩积分" backHref={`/students/${id}`} right={<button type="button" onClick={add}>登记</button>} />
      <div className="page-content">
        <p style={{ textAlign: "center", fontSize: 28, fontWeight: 600 }}>{total} 分</p>
        <IOSSection title="新增">
          <div className="form-field"><label>日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="form-field"><label>分值（可负）</label><input type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} /></div>
          <div className="form-field"><label>原因</label><input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
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
