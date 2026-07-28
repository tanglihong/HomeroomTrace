const cloudbase = require("@cloudbase/node-sdk");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/** Parses request body from CloudBase HTTP event or direct invoke payload. */
function parseBody(event) {
  if (!event) return {};
  if (typeof event.username === "string" || typeof event.action === "string") return event;

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

/** Initializes CloudBase app for current environment. */
function initApp(event) {
  const envId = event?.requestContext?.envId || process.env.TCB_ENV;
  return cloudbase.init({ env: envId || cloudbase.SYMBOL_CURRENT_ENV });
}

/** Loads RSA private key PEM from env (supports literal \\n or real newlines). */
function loadPrivateKey() {
  const raw = process.env.JWT_PRIVATE_KEY;
  if (!raw) throw new Error("JWT_PRIVATE_KEY not configured");
  if (raw.includes("BEGIN PRIVATE KEY") && raw.includes("\n")) return raw.trim();
  return raw.replace(/\\n/g, "\n").trim();
}

/** Issues a long-lived License JWT bound to account and device. */
function issueLicense(accountId, username, deviceId) {
  const years = Number(process.env.LICENSE_EXPIRY_YEARS || "10");
  const expSec = Math.floor(Date.now() / 1000) + years * 365 * 24 * 60 * 60;
  const privateKey = loadPrivateKey();
  return jwt.sign({ username, deviceId, sub: accountId }, privateKey, {
    algorithm: "RS256",
    expiresIn: expSec - Math.floor(Date.now() / 1000),
  });
}

/** Normalizes database query result to array of documents. */
function asRows(result) {
  const data = result?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/** Loads RSA public key PEM from env (supports literal \\n or real newlines). */
function loadPublicKey() {
  const raw = process.env.JWT_PUBLIC_KEY;
  if (!raw) throw new Error("JWT_PUBLIC_KEY not configured");
  if (raw.includes("BEGIN PUBLIC KEY") && raw.includes("\n")) return raw.trim();
  return raw.replace(/\\n/g, "\n").trim();
}

/** Verifies license is still valid on server (account exists, enabled, device bound). */
async function handleValidateSession(body, corsHeaders, event) {
  const license = String(body.license || "").trim();
  if (!license) {
    return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "缺少 license" }) };
  }

  let payload;
  try {
    payload = jwt.verify(license, loadPublicKey(), { algorithms: ["RS256"] });
  } catch {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "License 无效或已过期" }) };
  }

  const accountId = String(payload.sub || "");
  const deviceId = String(payload.deviceId || "");
  if (!accountId || !deviceId) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "License 无效" }) };
  }

  const app = initApp(event);
  const db = app.database();
  const rows = asRows(await db.collection("accounts").doc(accountId).get());
  const account = rows[0];

  if (!account) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "账号不存在或已删除" }) };
  }
  if (account.disabled) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "账号已禁用" }) };
  }
  if (account.deviceId !== deviceId) {
    return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "设备绑定已失效，请重新登录" }) };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      ok: true,
      username: account.username,
      displayName: account.displayName || account.username,
    }),
  };
}

/**
 * POST body: { username, password, deviceId } | { action: "validateSession", license }
 * Returns { license, username, displayName } or error status.
 */
exports.main = async (event) => {
  if (event?.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  try {
    const body = parseBody(event);
    if (body.action === "validateSession") {
      return handleValidateSession(body, corsHeaders, event);
    }

    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const deviceId = String(body.deviceId || "").trim();

    if (!username || !password || !deviceId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "缺少 username、password 或 deviceId" }) };
    }

    const app = initApp(event);
    const db = app.database();
    const rows = asRows(await db.collection("accounts").where({ username }).limit(1).get());
    const account = rows[0];

    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ error: "用户名或密码错误" }) };
    }

    if (account.disabled) {
      return { statusCode: 403, headers: corsHeaders, body: JSON.stringify({ error: "账号已禁用，请联系管理员" }) };
    }

    if (account.deviceId && account.deviceId !== deviceId) {
      return {
        statusCode: 409,
        headers: corsHeaders,
        body: JSON.stringify({ error: "该账号已在其他设备登录，请联系管理员解绑" }),
      };
    }

    const accountId = account._id || account.id;
    if (!account.deviceId || account.deviceId !== deviceId) {
      await db.collection("accounts").doc(accountId).update({
        deviceId,
        boundAt: Date.now(),
      });
    }

    const license = issueLicense(String(accountId), username, deviceId);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        license,
        username,
        displayName: account.displayName || username,
      }),
    };
  } catch (err) {
    console.error("auth-login error", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "服务器错误" }),
    };
  }
};
