import BehaviorPageClient from "./behavior-page-client";
import { dynamicRouteStaticParams } from "@/lib/dynamic-route-static-params";

export function generateStaticParams() {
  return dynamicRouteStaticParams();
}

export default function BehaviorPage() {
  return <BehaviorPageClient />;
}
