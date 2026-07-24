"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { GradesView } from "@/features/views/grades-view";
import { MineView } from "@/features/views/mine-view";
import { StudentsView } from "@/features/views/students-view";
import { WorkbenchView } from "@/features/views/workbench-view";
import { AppContainerProvider, useAppContainer } from "@/lib/app-container";
import { DataStoreProvider } from "@/lib/data-store";
import { TabBar, TAB_ROOTS } from "@/features/common/tab-bar";
import { ToastProvider } from "@/features/common/toast";

const TAB_VIEWS: Record<(typeof TAB_ROOTS)[number], React.ComponentType> = {
  "/workbench": WorkbenchView,
  "/students": StudentsView,
  "/grades": GradesView,
  "/mine": MineView,
};

function ShellInner({ children }: { children: ReactNode }) {
  const { ready } = useAppContainer();
  const pathname = usePathname();
  const isTabRoot = TAB_ROOTS.includes(pathname as (typeof TAB_ROOTS)[number]);
  const showTab = isTabRoot;
  const mainRef = useRef<HTMLElement>(null);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (!isTabRoot || prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;
    requestAnimationFrame(() => {
      const panel = mainRef.current?.querySelector<HTMLElement>(".tab-panel:not([hidden])");
      panel?.scrollTo(0, 0);
    });
  }, [pathname, isTabRoot]);

  if (!ready) {
    return <div className="bootstrap-loading">正在初始化…</div>;
  }

  return (
    <div className="app-shell">
      <main ref={mainRef} className={`app-main ${showTab ? "" : "no-tab"}`}>
        {TAB_ROOTS.map((tab) => {
          const View = TAB_VIEWS[tab];
          const active = pathname === tab;
          return (
            <div key={tab} className="tab-panel" hidden={!active} aria-hidden={!active}>
              <View />
            </div>
          );
        })}
        {!isTabRoot && children}
      </main>
      {showTab && <TabBar />}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppContainerProvider>
      <DataStoreProvider>
        <ToastProvider>
          <ShellInner>{children}</ShellInner>
        </ToastProvider>
      </DataStoreProvider>
    </AppContainerProvider>
  );
}
