"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import RecordDetailPageClient from "../[id]/record-detail-page-client";

function RecordDetailInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <>
        <IOSNavBar title="留痕详情" backHref="/records" />
        <p style={{ padding: 16, color: "#8e8e93" }}>未找到留痕</p>
      </>
    );
  }
  return <RecordDetailPageClient recordId={id} />;
}

export default function RecordDetailPage() {
  return (
    <Suspense>
      <RecordDetailInner />
    </Suspense>
  );
}
