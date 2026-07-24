"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import GradeInsightPageClient from "./[id]/grade-insight-page-client";

function GradeInsightInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <>
        <IOSNavBar title="学情简报" backHref="/grades" />
        <p style={{ padding: 16, color: "#8e8e93" }}>未找到成绩表</p>
      </>
    );
  }
  return <GradeInsightPageClient sheetId={id} />;
}

export default function GradeInsightPage() {
  return (
    <Suspense>
      <GradeInsightInner />
    </Suspense>
  );
}
