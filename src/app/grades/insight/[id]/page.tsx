import GradeInsightPageClient from "./grade-insight-page-client";
import { dynamicRouteStaticParams } from "@/lib/dynamic-route-static-params";

export function generateStaticParams() {
  return dynamicRouteStaticParams();
}

export default function GradeInsightPage() {
  return <GradeInsightPageClient />;
}
