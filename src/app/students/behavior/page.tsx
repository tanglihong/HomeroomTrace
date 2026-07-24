"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { IOSNavBar } from "@/features/common/ios-nav-bar";
import BehaviorPageClient from "./[id]/behavior-page-client";

function BehaviorInner() {
  const id = useSearchParams().get("id");
  if (!id) {
    return (
      <>
        <IOSNavBar title="奖惩积分" backHref="/students" />
        <p style={{ padding: 16, color: "#8e8e93" }}>未找到学生</p>
      </>
    );
  }
  return <BehaviorPageClient studentId={id} />;
}

export default function BehaviorPage() {
  return (
    <Suspense>
      <BehaviorInner />
    </Suspense>
  );
}
