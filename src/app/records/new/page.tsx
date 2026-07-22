"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RecordEditor } from "@/features/records/record-editor";
import type { WorkRecordType } from "@/domain/models/work-record-type";

function NewRecordInner() {
  const params = useSearchParams();
  const type = (params.get("type") as WorkRecordType) || "classDiary";
  return <RecordEditor mode="create" initialType={type} />;
}

export default function NewRecordPage() {
  return (
    <Suspense>
      <NewRecordInner />
    </Suspense>
  );
}
