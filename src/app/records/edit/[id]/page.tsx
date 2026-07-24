import EditRecordPageClient from "./edit-record-page-client";
import { dynamicRouteStaticParams } from "@/lib/dynamic-route-static-params";

export function generateStaticParams() {
  return dynamicRouteStaticParams();
}

export default function EditRecordPage() {
  return <EditRecordPageClient />;
}
