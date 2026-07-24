import StudentDetailPageClient from "./student-detail-page-client";
import { dynamicRouteStaticParams } from "@/lib/dynamic-route-static-params";

export function generateStaticParams() {
  return dynamicRouteStaticParams();
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentDetailPageClient studentId={id} />;
}
