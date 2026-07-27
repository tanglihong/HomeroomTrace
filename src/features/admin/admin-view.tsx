"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  type AdminAccount,
  createAccount,
  deleteAccount,
  disableAccount,
  enableAccount,
  filterAccounts,
  listAccounts,
  unbindDevice,
} from "@/lib/auth/admin-api";
import { AdminApiError, useAdminAuth } from "@/lib/auth/admin-context";
import { IOSButton, IOSFormRow, IOSFormSection } from "@/features/common/ios-form";
import { useIOSAlert } from "@/features/common/ios-alert";
import { useToast } from "@/features/common/toast";

function formatTime(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("zh-CN");
}

function statusLabel(status: AdminAccount["status"]): string {
  switch (status) {
    case "available":
      return "可用（未登录）";
    case "bound":
      return "已绑定设备";
    case "disabled":
      return "已禁用";
  }
}

function statusClass(status: AdminAccount["status"]): string {
  switch (status) {
    case "available":
      return "admin-status-available";
    case "bound":
      return "admin-status-bound";
    case "disabled":
      return "admin-status-disabled";
  }
}

function AdminLoginForm() {
  const { login } = useAdminAuth();
  const toast = useToast();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.show("请输入管理员账号和密码", true);
      return;
    }
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      toast.show("管理员登录成功");
    } catch (err) {
      toast.show(err instanceof AdminApiError ? err.message : "登录失败", true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-page-header">
        <h1 className="login-page-title">账号管理</h1>
        <p className="login-page-subtitle">管理员登录</p>
      </header>
      <form className="login-page-form" onSubmit={(e) => void onSubmit(e)}>
        <IOSFormSection title="管理员">
          <IOSFormRow label="用户名">
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" disabled={submitting} />
          </IOSFormRow>
          <IOSFormRow label="密码">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={submitting}
            />
          </IOSFormRow>
        </IOSFormSection>
        <IOSButton variant="filled" fullWidth type="submit" disabled={submitting}>
          {submitting ? "登录中…" : "登录管理后台"}
        </IOSButton>
      </form>
    </div>
  );
}

function AdminDashboard() {
  const { token, username, logout } = useAdminAuth();
  const toast = useToast();
  const { confirm } = useIOSAlert();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newDisplay, setNewDisplay] = useState("");
  const [creating, setCreating] = useState(false);

  const filteredAccounts = useMemo(() => filterAccounts(accounts, search), [accounts, search]);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const list = await listAccounts(token);
      setAccounts(list);
    } catch (err) {
      toast.show(err instanceof AdminApiError ? err.message : "加载失败", true);
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const u = newUser.trim();
    if (!u || !newPass) {
      toast.show("请输入新账号用户名和密码", true);
      return;
    }
    setCreating(true);
    try {
      await createAccount(token, { username: u, password: newPass, displayName: newDisplay.trim() || u });
      toast.show("账号已创建");
      setNewUser("");
      setNewPass("");
      setNewDisplay("");
      await reload();
    } catch (err) {
      toast.show(err instanceof AdminApiError ? err.message : "创建失败", true);
    } finally {
      setCreating(false);
    }
  };

  const runAction = async (label: string, fn: () => Promise<void>) => {
    try {
      await fn();
      toast.show(label);
      await reload();
    } catch (err) {
      toast.show(err instanceof AdminApiError ? err.message : "操作失败", true);
    }
  };

  const onDelete = async (acc: AdminAccount) => {
    const ok = await confirm({
      title: "删除账号",
      message: `确定删除账号「${acc.displayName || acc.username}」？此操作不可恢复。`,
      confirmLabel: "删除",
      destructive: true,
    });
    if (!ok || !token) return;
    await runAction("账号已删除", () => deleteAccount(token, acc.accountId));
  };

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">账号管理</h1>
          <p className="admin-page-subtitle">管理员：{username}</p>
        </div>
        <IOSButton variant="plain" onClick={logout}>
          退出
        </IOSButton>
      </header>

      <form className="admin-create-form" onSubmit={(e) => void onCreate(e)}>
        <IOSFormSection title="创建账号">
          <IOSFormRow label="用户名">
            <input value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="登录用户名" disabled={creating} />
          </IOSFormRow>
          <IOSFormRow label="密码">
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="初始密码"
              disabled={creating}
            />
          </IOSFormRow>
          <IOSFormRow label="显示名">
            <input value={newDisplay} onChange={(e) => setNewDisplay(e.target.value)} placeholder="可选" disabled={creating} />
          </IOSFormRow>
        </IOSFormSection>
        <IOSButton variant="filled" fullWidth type="submit" disabled={creating}>
          {creating ? "创建中…" : "创建账号"}
        </IOSButton>
      </form>

      <section className="admin-list-section">
        <h2 className="ios-form-section-title">
          全部账号 ({accounts.length}
          {search.trim() ? ` / 匹配 ${filteredAccounts.length}` : ""})
        </h2>
        <div className="admin-search-bar">
          <input
            type="search"
            className="admin-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索用户名、显示名、状态…"
          />
          {search && (
            <button type="button" className="admin-search-clear" onClick={() => setSearch("")}>
              清除
            </button>
          )}
        </div>
        {loading ? (
          <p className="admin-empty">加载中…</p>
        ) : accounts.length === 0 ? (
          <p className="admin-empty">暂无账号</p>
        ) : filteredAccounts.length === 0 ? (
          <p className="admin-empty">没有匹配的账号</p>
        ) : (
          <div className="admin-account-list">
            {filteredAccounts.map((acc) => (
              <div key={acc.accountId} className="admin-account-card">
                <div className="admin-account-main">
                  <div className="admin-account-name">{acc.displayName || acc.username}</div>
                  <div className="admin-account-meta">@{acc.username}</div>
                  <span className={`admin-status-badge ${statusClass(acc.status)}`}>{statusLabel(acc.status)}</span>
                </div>
                <div className="admin-account-detail">
                  <div>绑定时间：{formatTime(acc.boundAt)}</div>
                  <div className="admin-device-id">设备 ID：{acc.deviceId ? `${acc.deviceId.slice(0, 8)}…` : "—"}</div>
                </div>
                <div className="admin-account-actions">
                  {acc.deviceId && (
                    <IOSButton
                      variant="tinted"
                      onClick={() => void runAction("已解绑设备", () => unbindDevice(token!, acc.accountId))}
                    >
                      解绑设备
                    </IOSButton>
                  )}
                  {acc.disabled ? (
                    <IOSButton
                      variant="tinted"
                      onClick={() => void runAction("已启用账号", () => enableAccount(token!, acc.accountId))}
                    >
                      启用
                    </IOSButton>
                  ) : (
                    <IOSButton
                      variant="plain"
                      onClick={() => void runAction("已禁用账号", () => disableAccount(token!, acc.accountId))}
                    >
                      禁用
                    </IOSButton>
                  )}
                  <IOSButton variant="destructive" onClick={() => void onDelete(acc)}>
                    删除
                  </IOSButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/** Admin console for managing login accounts. */
export function AdminView() {
  const { status } = useAdminAuth();

  if (status === "loading") {
    return <div className="bootstrap-loading">正在加载…</div>;
  }

  if (status === "unauthorized") {
    return <AdminLoginForm />;
  }

  return <AdminDashboard />;
}
