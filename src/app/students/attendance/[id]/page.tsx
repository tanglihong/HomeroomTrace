import AttendancePageClient from "./attendance-page-client";
import { dynamicRouteStaticParams } from "@/lib/dynamic-route-static-params";

export function generateStaticParams() {
  return dynamicRouteStaticParams();
}

export default function AttendancePage() {
  return <AttendancePageClient />;
}
