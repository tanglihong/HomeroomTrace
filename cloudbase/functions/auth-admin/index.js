const cloudbase = require("@cloudbase/node-sdk");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: JSON.stringify(body),
  };
}

/** Parses request body from CloudBase HTTP event or direct invoke payload. */
function parseBody(event) {
  if (!event) return {};
  if (typeof event.action === "string") return event;

  let raw = event.body;
  if (!raw) return {};
  if (typeof raw === "object") return raw;
  if (event.isBase64Encoded) {
    raw = Buffer.from(raw, "base64").toString("utf8");
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function getHeader(event, name) {
  const headers = event.headers || {};
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return v;
  }
  return undefined;
}

/** Verifies admin via X-Admin-Secret or Bearer admin token. */
function assertAdminAuth(event) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) throw Object.assign(new Error("ADMIN_SECRET not configured"), { statusCode: 500 });

  if (getHeader(event, "X-Admin-Secret") === secret) return;

  const auth = getHeader(event, "Authorization");
  if (auth?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(auth.slice(7), secret);
      if (payload?.role === "admin") return;
    } catch {
      // fall through
    }
  }

  throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
}

function asRows(result) {
  const data = result?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function accountStatus(account) {
  if (account.disabled) return "disabled";
  if (account.deviceId) return "bound";
  return "available";
}

/**
 * Admin API — actions:
 * adminLogin | createAccount | listAccounts | disableAccount | enableAccount | unbindDevice | deleteAccount
 */
exports.main = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Admin-Secret, Authorization",
      },
      body: "",
    };
  }

  try {
    const body = parseBody(event);
    const action = body.action;

    if (action === "adminLogin") {
      const username = String(body.username || "").trim();
      const password = String(body.password || "");
      const expectedUser = process.env.ADMIN_USERNAME || "admin";
      const expectedPass = process.env.ADMIN_PASSWORD;
      if (!expectedPass) return jsonResponse(500, { error: "管理员账号未配置" });
      if (username !== expectedUser || password !== expectedPass) {
        return jsonResponse(401, { error: "管理员用户名或密码错误" });
      }
      const adminToken = jwt.sign({ role: "admin", username }, process.env.ADMIN_SECRET, { expiresIn: "8h" });
      return jsonResponse(200, { adminToken, username });
    }

    assertAdminAuth(event);

    const envId = event?.requestContext?.envId || process.env.TCB_ENV;
    const app = cloudbase.init({ env: envId || cloudbase.SYMBOL_CURRENT_ENV });
    const db = app.database();
    const accounts = db.collection("accounts");

    switch (action) {
      case "createAccount": {
        const username = String(body.username || "").trim();
        const password = String(body.password || "");
        const displayName = body.displayName ? String(body.displayName).trim() : username;
        if (!username || !password) return jsonResponse(400, { error: "缺少 username 或 password" });

        const existing = asRows(await accounts.where({ username }).limit(1).get());
        if (existing.length) return jsonResponse(409, { error: "用户名已存在" });

        const passwordHash = await bcrypt.hash(password, 10);
        const now = Date.now();
        const { id } = await accounts.add({
          username,
          passwordHash,
          displayName,
          deviceId: null,
          boundAt: null,
          disabled: false,
          createdAt: now,
          createdBy: "admin",
        });
        return jsonResponse(200, { accountId: id, username });
      }

      case "listAccounts": {
        const rows = asRows(
          await accounts
            .field({
              username: true,
              displayName: true,
              deviceId: true,
              boundAt: true,
              disabled: true,
              createdAt: true,
            })
            .get(),
        );
        const list = rows.map((doc) => {
          const accountId = doc._id || doc.id;
          const deviceId = doc.deviceId || null;
          const disabled = !!doc.disabled;
          const item = {
            accountId,
            username: doc.username,
            displayName: doc.displayName,
            deviceId,
            boundAt: doc.boundAt || null,
            disabled,
            createdAt: doc.createdAt,
            status: accountStatus({ disabled, deviceId }),
          };
          return item;
        });
        return jsonResponse(200, { accounts: list });
      }

      case "disableAccount": {
        const accountId = String(body.accountId || "");
        if (!accountId) return jsonResponse(400, { error: "缺少 accountId" });
        await accounts.doc(accountId).update({ disabled: true });
        return jsonResponse(200, { ok: true });
      }

      case "enableAccount": {
        const accountId = String(body.accountId || "");
        if (!accountId) return jsonResponse(400, { error: "缺少 accountId" });
        await accounts.doc(accountId).update({ disabled: false });
        return jsonResponse(200, { ok: true });
      }

      case "unbindDevice": {
        const accountId = String(body.accountId || "");
        if (!accountId) return jsonResponse(400, { error: "缺少 accountId" });
        await accounts.doc(accountId).update({ deviceId: null, boundAt: null });
        return jsonResponse(200, { ok: true });
      }

      case "deleteAccount": {
        const accountId = String(body.accountId || "");
        if (!accountId) return jsonResponse(400, { error: "缺少 accountId" });
        const rows = asRows(await accounts.doc(accountId).get());
        const doc = rows[0];
        if (!doc) return jsonResponse(404, { error: "账号不存在" });
        await accounts.doc(accountId).remove();
        return jsonResponse(200, { ok: true, username: doc.username });
      }

      default:
        return jsonResponse(400, { error: "未知 action" });
    }
  } catch (err) {
    const statusCode = err.statusCode || 500;
    console.error("auth-admin error", err);
    return jsonResponse(statusCode, { error: err.message || "服务器错误" });
  }
};
