import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "filled" | "tinted" | "plain" | "destructive";

interface IOSButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
  icon?: ReactNode;
}

/** iOS 风格按钮：filled / tinted / plain / destructive */
export function IOSButton({
  variant = "tinted",
  fullWidth = false,
  icon,
  className = "",
  children,
  ...props
}: IOSButtonProps) {
  return (
    <button
      type="button"
      className={`ios-btn ios-btn-${variant} ${fullWidth ? "ios-btn-full" : ""} ${className}`.trim()}
      {...props}
    >
      {icon && <span className="ios-btn-icon">{icon}</span>}
      <span className="ios-btn-label">{children}</span>
    </button>
  );
}

interface IOSFileButtonProps {
  accept?: string;
  onChange: InputHTMLAttributes<HTMLInputElement>["onChange"];
  children: ReactNode;
  icon?: ReactNode;
}

/** 文件选择按钮（隐藏 input，避免布局错乱） */
export function IOSFileButton({ accept, onChange, children, icon }: IOSFileButtonProps) {
  return (
    <label className="ios-action-row">
      {icon && <span className="ios-action-row-icon">{icon}</span>}
      <span className="ios-action-row-label">{children}</span>
      <input type="file" accept={accept} className="ios-hidden-input" onChange={onChange} />
    </label>
  );
}

/** 分组表单区块 */
export function IOSFormSection({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <section className="ios-form-section">
      {title && <h3 className="ios-form-section-title">{title}</h3>}
      <div className="ios-form-group">{children}</div>
      {footer && <p className="ios-form-section-footer">{footer}</p>}
    </section>
  );
}

/** 表单行：左侧标签 + 右侧控件 */
export function IOSFormRow({
  label,
  children,
  stack,
}: {
  label: string;
  children: ReactNode;
  stack?: boolean;
}) {
  return (
    <div className={`ios-form-row ${stack ? "ios-form-row-stack" : ""}`}>
      <label className="ios-form-row-label">{label}</label>
      <div className="ios-form-row-control">{children}</div>
    </div>
  );
}

/** 附件/操作行列表 */
export function IOSActionGroup({ children }: { children: ReactNode }) {
  return <div className="ios-action-group">{children}</div>;
}

export function IOSActionRow({
  onClick,
  icon,
  children,
  destructive,
  disabled,
}: {
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`ios-action-row ${destructive ? "ios-action-row-destructive" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="ios-action-row-icon">{icon}</span>}
      <span className="ios-action-row-label">{children}</span>
    </button>
  );
}
