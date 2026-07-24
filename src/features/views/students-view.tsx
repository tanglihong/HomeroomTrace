"use client";



import Link from "next/link";

import { memo, useMemo, useState } from "react";

import { IOSEmpty } from "@/features/common/ios-list";

import { IOSNavBar, IOSNavLink } from "@/features/common/ios-nav-bar";

import { useToast } from "@/features/common/toast";

import { useDataStore } from "@/lib/data-store";

import { downloadExcelTemplate, STUDENT_CSV_HEADER } from "@/lib/import-templates";



export const StudentsView = memo(function StudentsView() {

  const { students } = useDataStore();

  const toast = useToast();

  const [keyword, setKeyword] = useState("");



  const filtered = useMemo(() => {

    const list = students ?? [];

    if (!keyword.trim()) return list;

    return list.filter(

      (s) =>

        s.name.includes(keyword) ||

        s.studentNo.includes(keyword) ||

        (s.parentName?.includes(keyword) ?? false),

    );

  }, [students, keyword]);



  const exportRoster = async () => {

    if (!students || students.length === 0) {

      toast.show("暂无学生可导出", true);

      return;

    }

    const lines = students.map((s) =>

      [s.studentNo, s.name, s.gender ?? "", s.parentName ?? "", s.parentPhone ?? "", s.note ?? ""].join(","),

    );

    const template = `${STUDENT_CSV_HEADER}\n${lines.join("\n")}`;

    await downloadExcelTemplate(template, `学生名册-${Date.now()}.xlsx`);

    toast.show("名册已导出");

  };



  return (

    <>

      <IOSNavBar

        title="学生"

        large

        right={

          <div style={{ display: "flex", gap: 12 }}>

            <IOSNavLink href="/students/import">导入</IOSNavLink>

            <IOSNavLink href="/students/new">添加</IOSNavLink>

          </div>

        }

      />

      <div className="filter-bar">

        <input type="search" placeholder="搜索姓名/学号" value={keyword} onChange={(e) => setKeyword(e.target.value)} />

        <button type="button" className="ios-btn ios-btn-tinted" onClick={() => void exportRoster()}>

          导出名册

        </button>

      </div>

      <div className="page-content">

        {!students ? (

          <IOSEmpty title="加载中…" />

        ) : filtered.length === 0 ? (

          <IOSEmpty title="暂无学生" description="添加或导入名册" />

        ) : (

          <div className="ios-group">

            {filtered.map((s) => (

              <Link key={s.id} href={`/students/detail?id=${s.id}`} prefetch className="ios-row has-chevron record-row">

                <div className="record-row-main">

                  <span className="record-type-icon" style={{ background: "rgba(0,122,255,0.12)", color: "#007AFF" }}>

                    <span style={{ fontSize: 15, fontWeight: 600 }}>{s.name.charAt(0)}</span>

                  </span>

                  <div className="record-row-text">

                    <div className="record-row-title">{s.name}</div>

                    <div className="record-subtitle">学号 {s.studentNo}</div>

                  </div>

                </div>

              </Link>

            ))}

          </div>

        )}

      </div>

    </>

  );

});

