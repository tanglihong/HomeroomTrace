import { afterEach, describe, expect, it, vi } from "vitest";
import { checkSession } from "@/lib/auth/auth-api";

describe("checkSession", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns valid when server ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    }));

    await expect(checkSession("jwt-token")).resolves.toBe("valid");
  });

  it("returns revoked when account deleted or disabled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: "账号不存在或已删除" }),
    }));

    await expect(checkSession("jwt-token")).resolves.toBe("revoked");
  });

  it("returns unavailable on network error without treating as revoked", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(checkSession("jwt-token")).resolves.toBe("unavailable");
  });

  it("returns unavailable on server error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "服务器错误" }),
    }));

    await expect(checkSession("jwt-token")).resolves.toBe("unavailable");
  });
});
