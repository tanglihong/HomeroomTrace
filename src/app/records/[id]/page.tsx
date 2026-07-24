import RecordDetailPageClient from "./record-detail-page-client";
import { dynamicRouteStaticParams } from "@/lib/dynamic-route-static-params";

export function generateStaticParams() {
  return dynamicRouteStaticParams();
}

export default function RecordDetailPage() {
  return <RecordDetailPageClient />;
}
