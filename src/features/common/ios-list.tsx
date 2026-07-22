import type { ReactNode } from "react";
import { IconDoc } from "@/features/common/icons";

export function IOSSection({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  return (
    <section className="ios-section">
      {title && <h2 className="ios-section-title">{title}</h2>}
      <div className="ios-group">{children}</div>
      {footer && <p className="ios-section-footer">{footer}</p>}
    </section>
  );
}

export function IOSRow({
  children,
  href,
  onClick,
  chevron,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  chevron?: boolean;
}) {
  const className = `ios-row ${chevron ? "has-chevron" : ""}`;
  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {children}
      </button>
    );
  }
  return <div className={className}>{children}</div>;
}

export function IOSEmpty({ title, description, icon }: { title: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="ios-empty">
      <div className="ios-empty-icon">{icon ?? <IconDoc size={40} />}</div>
      <p className="ios-empty-title">{title}</p>
      {description && <p className="ios-empty-desc">{description}</p>}
    </div>
  );
}

export function LoadingOverlay({ show, message = "加载中…" }: { show: boolean; message?: string }) {
  if (!show) return null;
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <p>{message}</p>
    </div>
  );
}

export function PageSectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="page-section-title">{children}</h2>;
}
