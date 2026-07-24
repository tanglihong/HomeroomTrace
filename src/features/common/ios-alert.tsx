"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export interface IOSConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface AlertRequest extends IOSConfirmOptions {
  resolve: (value: boolean) => void;
}

interface IOSAlertContextValue {
  confirm: (options: IOSConfirmOptions) => Promise<boolean>;
}

const IOSAlertContext = createContext<IOSAlertContextValue | null>(null);

export function IOSAlertProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<AlertRequest | null>(null);
  const queueRef = useRef<AlertRequest[]>([]);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    setCurrent(next);
  }, []);

  const confirm = useCallback((options: IOSConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      const request: AlertRequest = { ...options, resolve };
      setCurrent((active) => {
        if (!active) return request;
        queueRef.current.push(request);
        return active;
      });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      current?.resolve(result);
      showNext();
    },
    [current, showNext],
  );

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <IOSAlertContext.Provider value={value}>
      {children}
      {current && (
        <div className="ios-alert-backdrop" role="presentation" onClick={() => close(false)}>
          <div
            className="ios-alert"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ios-alert-title"
            aria-describedby={current.message ? "ios-alert-message" : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ios-alert-body">
              <h3 id="ios-alert-title" className="ios-alert-title">
                {current.title}
              </h3>
              {current.message && (
                <p id="ios-alert-message" className="ios-alert-message">
                  {current.message}
                </p>
              )}
            </div>
            <div className="ios-alert-actions">
              <button type="button" className="ios-alert-btn" onClick={() => close(false)}>
                {current.cancelLabel ?? "取消"}
              </button>
              <button
                type="button"
                className={`ios-alert-btn ${current.destructive ? "ios-alert-btn-destructive" : "ios-alert-btn-primary"}`}
                onClick={() => close(true)}
              >
                {current.confirmLabel ?? "确定"}
              </button>
            </div>
          </div>
        </div>
      )}
    </IOSAlertContext.Provider>
  );
}

export function useIOSAlert(): IOSAlertContextValue {
  const ctx = useContext(IOSAlertContext);
  if (!ctx) throw new Error("useIOSAlert must be used within IOSAlertProvider");
  return ctx;
}
