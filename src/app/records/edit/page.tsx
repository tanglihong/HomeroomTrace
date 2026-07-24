"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import { RecordEditor } from "@/features/records/record-editor";

function EditRecordInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <>
        <IOSNavBar title="编辑留痕" backHref="/records" />
        <p style={{ padding: 16, color: "#8e8e93" }}>未找到留痕</p>
      </>
    );
  }
  return <RecordEditor mode="edit" recordId={id} />;
}

export default function EditRecordPage() {
  return (
    <Suspense>
      <EditRecordInner />
    </Suspense>
  );
}
