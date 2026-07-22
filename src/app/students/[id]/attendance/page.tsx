"use client";
export function generateStaticParams() { return []; }
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ATTENDANCE_STATUS_LABELS, type AttendanceDTO, type AttendanceStatus } from "@/domain/use-cases/repositories";
import { IOSSection } from "@/features/common/ios-list";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { formatRecordDate, toDateInputValue } from "@/lib/format";

export default function AttendancePage() {
  const { id } = useParams<{ id: string }>();
  const container = useAppContainer();
  const toast = useToast();
  const [list, setList] = useState<AttendanceDTO[]>([]);
  const [date, setDate] = useState(toDateInputValue(new Date()));
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [note, setNote] = useState("");

  const reload = useCallback(async () => {
    setList(await container.attendance.list(id));
  }, [container, id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = async () => {
    try {
      await container.attendance.add(id, new Date(`${date}T12:00:00`), status, note || undefined);
      setNote("");
      await reload();
      toast.show("已登记");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "登记失败", true);
    }
  };

  return (
    <>
      <IOSNavBar title="考勤" backHref={`/students/${id}`} right={<button type="button" onClick={add}>登记</button>} />
      <div className="page-content">
        <IOSSection title="新增">
          <div className="form-field"><label>日期</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
          <div className="form-field">
            <label>状态</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as AttendanceStatus)}>
              {(Object.keys(ATTENDANCE_STATUS_LABELS) as AttendanceStatus[]).map((s) => (
                <option key={s} value={s}>{ATTENDANCE_STATUS_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div className="form-field"><label>备注</label><input value={note} onChange={(e) => setNote(e.target.value)} /></div>
        </IOSSection>
        <IOSSection title="历史">
          {list.map((a) => (
            <div key={a.id} className="ios-row">
              <div>{formatRecordDate(a.date)} · {ATTENDANCE_STATUS_LABELS[a.status]}</div>
              {a.note && <div className="record-subtitle">{a.note}</div>}
            </div>
          ))}
        </IOSSection>
      </div>
    </>
  );
}
