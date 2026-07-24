"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { StudentCSVParser } from "@/domain/import/student-csv-parser";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { useToast } from "@/features/common/toast";
import { useAppContainer } from "@/lib/app-container";
import { useDataStore } from "@/lib/data-store";

export default function StudentImportPage() {
  const container = useAppContainer();
  const { refreshStudents } = useDataStore();
  const toast = useToast();
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [result, setResult] = useState<string[]>([]);

  const importCsv = async () => {
    const { rows, errors } = StudentCSVParser.parse(csv);
    if (errors.length > 0 && rows.length === 0) {
      toast.show(errors[0], true);
      return;
    }
    try {
      const classId = container.requireClassId();
      const res = await container.students.importBatch(classId, rows);
      setResult([...errors, ...res.errors, `成功导入 ${res.imported} 人，跳过 ${res.skipped} 人`]);
      toast.show(`导入完成：${res.imported} 人`);
      if (res.imported > 0) {
        await refreshStudents(true);
        router.push("/students");
      }
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "导入失败", true);
    }
  };

  return (
    <>
      <IOSNavBar title="导入名册" backHref="/students" right={<button type="button" onClick={importCsv}>导入</button>} />
      <div className="page-content">
        <p style={{ padding: "0 16px", color: "#8e8e93", fontSize: 14 }}>
          CSV 首行：学号,姓名,性别,家长姓名,家长电话,备注
        </p>
        <div className="form-field">
          <textarea
            placeholder="粘贴 CSV 内容…"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
            style={{ minHeight: 200 }}
          />
        </div>
        {result.length > 0 && (
          <div className="ios-group">
            {result.map((line, i) => (
              <div key={i} className="ios-row record-subtitle">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
