"use client";
export function generateStaticParams() { return []; }
import { useParams } from "next/navigation";
import { RecordEditor } from "@/features/records/record-editor";

export default function EditRecordPage() {
  const { id } = useParams<{ id: string }>();
  return <RecordEditor mode="edit" recordId={id} />;
}
