export type AuthApiErrorCode = "NETWORK" | "UNAUTHORIZED" | "FORBIDDEN" | "CONFLICT" | "CONFIG";

/** Thrown when auth-login API fails or is misconfigured. */
export class AuthApiError extends Error {
  constructor(
    message: string,
    public code: AuthApiErrorCode,
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export interface LoginResult {
  license: string;
  username: string;
  displayName?: string;
}

function getAuthApiBase(): string {
  const base = process.env.NEXT_PUBLIC_AUTH_API_BASE?.replace(/\/$/, "");
  if (!base) {
    throw new AuthApiError("未配置登录服务地址（NEXT_PUBLIC_AUTH_API_BASE）", "CONFIG");
  }
  return base;
}

/** Calls CloudBase auth-login. Requires network. */
export async function login(username: string, password: string, deviceId: string): Promise<LoginResult> {
  const base = getAuthApiBase();
  const url = `${base}/auth-login`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, deviceId }),
    });
  } catch {
    throw new AuthApiError("请检查网络连接后重试", "NETWORK");
  }

  let data: { error?: string; license?: string; username?: string; displayName?: string } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    // ignore parse errors
  }

  if (res.status === 401) {
    throw new AuthApiError(data.error || "用户名或密码错误", "UNAUTHORIZED");
  }
  if (res.status === 403) {
    throw new AuthApiError(data.error || "账号已禁用，请联系管理员", "FORBIDDEN");
  }
  if (res.status === 409) {
    throw new AuthApiError(data.error || "该账号已在其他设备登录，请联系管理员解绑", "CONFLICT");
  }
  if (!res.ok || !data.license || !data.username) {
    throw new AuthApiError(data.error || "登录失败，请稍后重试", "NETWORK");
  }

  return {
    license: data.license,
    username: data.username,
    displayName: data.displayName,
  };
}

export type SessionCheckResult = "valid" | "revoked" | "unavailable";

/** Online session check: account still exists, enabled, and device still bound. */
export async function checkSession(license: string): Promise<SessionCheckResult> {
  const base = getAuthApiBase();
  const url = `${base}/auth-login`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "validateSession", license }),
    });
  } catch {
    return "unavailable";
  }

  let data: { ok?: boolean; error?: string } = {};
  try {
    data = (await res.json()) as typeof data;
  } catch {
    // ignore parse errors
  }

  if (res.status === 403 || res.status === 404) return "revoked";
  if (res.ok && data.ok) return "valid";
  return "unavailable";
}
