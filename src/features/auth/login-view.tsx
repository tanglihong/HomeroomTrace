"use client";

import { useState, type FormEvent } from "react";
import { IOSButton, IOSFormRow, IOSFormSection } from "@/features/common/ios-form";
import { useToast } from "@/features/common/toast";
import { AuthApiError } from "@/lib/auth/auth-api";
import { useAuth } from "@/lib/auth/auth-context";

/** Full-screen login form shown when no valid local License exists. */
export function LoginView() {
  const { login } = useAuth();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const user = username.trim();
    if (!user || !password) {
      toast.show("请输入用户名和密码", true);
      return;
    }

    setSubmitting(true);
    try {
      await login(user, password);
      toast.show("登录成功");
    } catch (err) {
      const message =
        err instanceof AuthApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "登录失败";
      toast.show(message, true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-page-header">
        <h1 className="login-page-title">班主任留痕</h1>
        <p className="login-page-subtitle">请登录后使用</p>
      </header>
      <form className="login-page-form" onSubmit={(e) => void onSubmit(e)}>
        <IOSFormSection title="账号">
          <IOSFormRow label="用户名">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              placeholder="请输入用户名"
              disabled={submitting}
            />
          </IOSFormRow>
          <IOSFormRow label="密码">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="请输入密码"
              disabled={submitting}
            />
          </IOSFormRow>
        </IOSFormSection>
        <IOSButton variant="filled" fullWidth disabled={submitting} type="submit">
          {submitting ? "登录中…" : "登录"}
        </IOSButton>
        <p className="login-page-hint">首次登录需联网；登录后本设备可离线使用</p>
      </form>
    </div>
  );
}
