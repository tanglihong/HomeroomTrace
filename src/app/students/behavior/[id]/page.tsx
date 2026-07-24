import BehaviorPageClient from "./behavior-page-client";
import { dynamicRouteStaticParams } from "@/lib/dynamic-route-static-params";

export function generateStaticParams() {
  return dynamicRouteStaticParams();
}

export default async function BehaviorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BehaviorPageClient studentId={id} />;
}
