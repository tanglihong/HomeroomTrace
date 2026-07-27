export type AdminAccountStatus = "available" | "bound" | "disabled";

export interface AdminAccount {
  accountId: string;
  username: string;
  displayName?: string;
  deviceId: string | null;
  boundAt: number | null;
  disabled: boolean;
  createdAt: number;
  status: AdminAccountStatus;
}

export class AdminApiError extends Error {
  constructor(
    message: string,
    public code: "NETWORK" | "UNAUTHORIZED" | "FORBIDDEN" | "CONFIG",
  ) {
    super(message);
    this.name = "AdminApiError";
  }
}

function getAuthApiBase(): string {
  const base = process.env.NEXT_PUBLIC_AUTH_API_BASE?.replace(/\/$/, "");
  if (!base) {
    throw new AdminApiError("未配置登录服务地址（NEXT_PUBLIC_AUTH_API_BASE）", "CONFIG");
  }
  return base;
}

async function adminRequest<T>(
  action: string,
  body: Record<string, unknown>,
  token?: string | null,
): Promise<T> {
  const url = `${getAuthApiBase()}/auth-admin`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ action, ...body }),
    });
  } catch {
    throw new AdminApiError("请检查网络连接后重试", "NETWORK");
  }

  let data: { error?: string } & T = {} as { error?: string } & T;
  try {
    data = (await res.json()) as typeof data;
  } catch {
    // ignore
  }

  if (res.status === 401) throw new AdminApiError(data.error || "未授权", "UNAUTHORIZED");
  if (res.status === 403) throw new AdminApiError(data.error || "无权限", "FORBIDDEN");
  if (!res.ok) throw new AdminApiError(data.error || "操作失败", "NETWORK");

  return data;
}

/** Admin login — returns token valid for 8 hours. */
export async function adminLogin(username: string, password: string): Promise<{ adminToken: string; username: string }> {
  return adminRequest("adminLogin", { username, password });
}

/** Lists all user accounts with bind/disabled status. */
export async function listAccounts(token: string): Promise<AdminAccount[]> {
  const data = await adminRequest<{ accounts: AdminAccount[] }>("listAccounts", {}, token);
  return data.accounts ?? [];
}

/** Creates a new user account. */
export async function createAccount(
  token: string,
  input: { username: string; password: string; displayName?: string },
): Promise<{ accountId: string; username: string }> {
  return adminRequest("createAccount", input, token);
}

export async function disableAccount(token: string, accountId: string): Promise<void> {
  await adminRequest("disableAccount", { accountId }, token);
}

export async function enableAccount(token: string, accountId: string): Promise<void> {
  await adminRequest("enableAccount", { accountId }, token);
}

export async function unbindDevice(token: string, accountId: string): Promise<void> {
  await adminRequest("unbindDevice", { accountId }, token);
}

/** Permanently deletes a user account. */
export async function deleteAccount(token: string, accountId: string): Promise<void> {
  await adminRequest("deleteAccount", { accountId }, token);
}

/** Filters accounts client-side by keyword (username, displayName, status). */
export function filterAccounts(accounts: AdminAccount[], keyword: string): AdminAccount[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return accounts;
  return accounts.filter((acc) => {
    const statusText = acc.status === "available" ? "可用" : acc.status === "bound" ? "已绑定" : "禁用";
    return (
      acc.username.toLowerCase().includes(q) ||
      (acc.displayName?.toLowerCase().includes(q) ?? false) ||
      statusText.includes(q) ||
      (acc.deviceId?.toLowerCase().includes(q) ?? false)
    );
  });
}
