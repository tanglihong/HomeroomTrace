"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import StudentDetailPageClient from "../[id]/student-detail-page-client";

function StudentDetailInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <>
        <IOSNavBar title="学生详情" backHref="/students" />
        <p style={{ padding: 16, color: "#8e8e93" }}>未找到学生</p>
      </>
    );
  }
  return <StudentDetailPageClient studentId={id} />;
}

export default function StudentDetailPage() {
  return (
    <Suspense>
      <StudentDetailInner />
    </Suspense>
  );
}
