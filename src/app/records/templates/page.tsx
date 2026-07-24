"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ALL_WORK_RECORD_TYPES, RecordTypeConfig, type WorkRecordType } from "@/domain/models/work-record-type";
import type { RecordTemplateDTO } from "@/domain/use-cases/repositories";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { IOSSelect } from "@/features/common/ios-filter-controls";
import { useToast } from "@/features/common/toast";
import { useIOSAlert } from "@/features/common/ios-alert";
import { useAppContainer } from "@/lib/app-container";

export default function RecordTemplatesPage() {
  const container = useAppContainer();
  const toast = useToast();
  const { confirm } = useIOSAlert();
  const [typeFilter, setTypeFilter] = useState<WorkRecordType | "">("");
  const [templates, setTemplates] = useState<RecordTemplateDTO[]>([]);

  useEffect(() => {
    void (async () => {
      const all: RecordTemplateDTO[] = [];
      for (const type of ALL_WORK_RECORD_TYPES) {
        const list = await container.templates.list(type);
        all.push(...list);
      }
      setTemplates(all);
    })();
  }, [container.templates]);

  const filtered = useMemo(() => {
    if (!typeFilter) return templates;
    return templates.filter((t) => t.type === typeFilter);
  }, [templates, typeFilter]);

  const grouped = useMemo(() => {
    const map = new Map<string, RecordTemplateDTO[]>();
    for (const t of filtered) {
      const list = map.get(t.type) ?? [];
      list.push(t);
      map.set(t.type, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const handleDelete = async (tpl: RecordTemplateDTO) => {
    if (!tpl.isUserCreated) {
      toast.show("内置模板不可删除", true);
      return;
    }
    const ok = await confirm({ title: "删除此模板？", confirmLabel: "删除", destructive: true });
    if (!ok) return;
    try {
      await container.templates.deleteUser(tpl.id);
      setTemplates((prev) => prev.filter((x) => x.id !== tpl.id));
      toast.show("已删除");
    } catch (e) {
      toast.show(e instanceof Error ? e.message : "删除失败", true);
    }
  };

  return (
    <>
      <IOSNavBar title="留痕模板" backHref="/workbench" />
      <div className="filter-bar">
        <IOSSelect value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as WorkRecordType | "")}>
          <option value="">全部类型</option>
          {ALL_WORK_RECORD_TYPES.map((t) => (
            <option key={t} value={t}>
              {RecordTypeConfig.configuration(t).displayName}
            </option>
          ))}
        </IOSSelect>
      </div>
      <div className="page-content template-market-page">
        <p className="template-market-hint">
          内置模板可直接使用；在留痕编辑页可将正文保存为自定义模板。
        </p>
        {grouped.length === 0 ? (
          <p style={{ padding: 16, color: "#8e8e93" }}>暂无模板</p>
        ) : (
          grouped.map(([type, items]) => (
            <section key={type} className="ios-section template-market-section">
              <h2 className="ios-section-title">
                {RecordTypeConfig.configuration(type as WorkRecordType).displayName}
              </h2>
              <div className="template-market-list">
                {items.map((tpl) => (
                  <article key={tpl.id} className="template-market-card">
                    <div className="template-market-card-header">
                      <div className="record-row-title">
                        {tpl.name}
                        {tpl.isUserCreated && <span className="template-badge">自定义</span>}
                      </div>
                      {tpl.isUserCreated && (
                        <button type="button" className="template-delete-btn" onClick={() => handleDelete(tpl)}>
                          删除
                        </button>
                      )}
                    </div>
                    <pre className="template-body-preview">{tpl.bodySkeleton.trimEnd()}</pre>
                    <Link
                      href={`/records/new?type=${type}&templateId=${tpl.id}`}
                      className="template-use-btn"
                    >
                      使用此模板
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
