"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconChevronRight } from "@/features/common/icons";

interface IOSNavBarProps {
  title: string;
  backHref?: string;
  right?: ReactNode;
  large?: boolean;
}

export function IOSNavBar({ title, backHref, right, large = false }: IOSNavBarProps) {
  if (large && !backHref) {
    return (
      <header className="ios-nav-bar ios-nav-bar-large">
        <div className="ios-nav-large-top">
          <h1 className="ios-nav-large-title">{title}</h1>
          {right && <div className="ios-nav-large-right">{right}</div>}
        </div>
      </header>
    );
  }

  return (
    <header className="ios-nav-bar">
      <div className="ios-nav-left">
        {backHref ? (
          <Link href={backHref} className="ios-nav-back">
            <span className="ios-nav-back-chevron">‹</span>
            <span>返回</span>
          </Link>
        ) : (
          <span className="ios-nav-spacer" />
        )}
      </div>
      <h1 className="ios-nav-title">{title}</h1>
      <div className="ios-nav-right">{right ?? <span className="ios-nav-spacer" />}</div>
    </header>
  );
}

export function IOSNavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="ios-nav-link">
      {children}
    </Link>
  );
}

export function IOSNavButton({ onClick, children, disabled }: { onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" className="ios-nav-link" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export { IconChevronRight };
