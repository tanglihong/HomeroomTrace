import GradeInsightPageClient from "./grade-insight-page-client";
import { dynamicRouteStaticParams } from "@/lib/dynamic-route-static-params";

export function generateStaticParams() {
  return dynamicRouteStaticParams();
}

export default async function GradeInsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GradeInsightPageClient sheetId={id} />;
}
