"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { TabIcons } from "@/features/common/icons";

export const TAB_ROOTS = ["/workbench", "/students", "/grades", "/mine"] as const;

const TABS = [
  { href: "/workbench", label: "工作台", iconKey: "workbench" as const },
  { href: "/students", label: "学生", iconKey: "students" as const },
  { href: "/grades", label: "成绩学情", iconKey: "grades" as const },
  { href: "/mine", label: "我的", iconKey: "mine" as const },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <nav className={`tab-bar ${isPending ? "tab-bar-pending" : ""}`} aria-label="主导航">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        const Icon = TabIcons[tab.iconKey];
        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            scroll={false}
            className={`tab-item ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={(e) => {
              if (active) {
                e.preventDefault();
                return;
              }
              e.preventDefault();
              startTransition(() => {
                router.push(tab.href);
              });
            }}
          >
            <span className="tab-icon-wrap">
              <Icon size={24} filled={active} />
            </span>
            <span className="tab-label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
