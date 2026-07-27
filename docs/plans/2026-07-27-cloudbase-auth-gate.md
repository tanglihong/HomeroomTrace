# CloudBase 账号门禁（离线 License）Implementation Plan

> **For Cursor:** REQUIRED SUB-SKILL: Use tinet-test-driven-development to implement this plan task-by-task.

**Goal:** 在保持业务数据 100% 本地 IndexedDB 的前提下，增加 CloudBase 轻量 Auth 服务：管理员可管理账号，用户首次联网登录后在当前设备永久可用，单账号仅允许绑定一台设备。

**Architecture:** PWA 仍为 Next.js 静态导出；CloudBase 云函数 + 文档型数据库仅负责账号验证与设备绑定，不存储任何班级/学生/留痕数据。登录成功后云函数签发 RS256 License JWT，客户端存入 localStorage 并用内嵌公钥离线验签；`app-shell.tsx` 入口守卫未授权用户。单设备互斥在云函数登录时通过 `accounts.deviceId` 字段实现。

**Tech Stack:** Next.js、TypeScript、Vitest、CloudBase 云函数（Node.js）、CloudBase 文档型数据库、`jose`（JWT 签发/验签）、现有 iOS 风格 CSS 组件（`ios-form`、`IOSNavBar`）。

**非功能约束：**
- 业务数据不上传 CloudBase
- 登录后日常使用完全离线
- 管理员禁用账号仅在下一次需重新登录时生效（已签发 License 在本地仍有效，见 Task 0 决策）
- 静态导出 `output: 'export'` 保持不变

---

## Task 0：确认产品决策（实施前必读）

以下决策已在需求讨论中确认，实施时不再变更：

| 决策项 | 选定方案 |
|--------|----------|
| 数据存储 | 始终本地 IndexedDB，CloudBase 只存账号 |
| 单设备策略 | 新设备登录被拒绝（旧设备继续可用） |
| 持久登录 | 长效 License JWT（10 年 expiry），离线验签 |
| 账号禁用 | 服务端标记 `disabled`；已登录设备不强制踢出（纯离线优先） |
| 清缓存重装 | 需管理员在后台「解绑设备」后才能重新登录 |
| 部署 | CloudBase Serverless，不买 CVM |

---

## UI 基线

**参考页面：** 登录页视觉对齐 `src/features/common/ios-form.tsx` + `globals.css` 中的 `.ios-form-section`、`.ios-btn-filled`。

| 属性 | 值 |
|------|-----|
| 页面背景 | `#F2F2F7`（与全局 grouped 列表一致） |
| 水平 padding | 16px |
| 表单卡片圆角 | 10px |
| 主按钮 | `IOSButton variant="filled" fullWidth` |
| 大标题 | 与表单页一致，「班主任留痕」+ 副标题「请登录后使用」 |
| 加载态 | 复用 `.bootstrap-loading` 文案「正在验证…」 |

**UI 验收清单：**
- [ ] 未登录时只显示登录页，不渲染 TabBar
- [ ] 登录页 iOS 分组表单风格，与「我的」页表单一致
- [ ] 错误信息用 Toast 展示（复用 `ToastProvider`）
- [ ] 「我的」页显示当前登录用户名 + 退出登录按钮

---

## 目录结构（新增）

```
PWA/
├── cloudbase/
│   ├── cloudbaserc.json              # 环境 ID 配置
│   ├── functions/
│   │   ├── auth-login/               # 用户登录 + 设备绑定 + 签发 License
│   │   │   ├── index.js
│   │   │   └── package.json
│   │   └── auth-admin/               # 管理员：创建/列表/禁用/解绑
│   │       ├── index.js
│   │       └── package.json
│   └── keys/                         # gitignore：RSA 密钥对（开发用）
│       ├── private.pem
│       └── public.pem
├── src/
│   ├── lib/auth/
│   │   ├── device-id.ts              # 生成/读取 deviceId
│   │   ├── license-store.ts          # 读写/清除本地 License
│   │   ├── license-validator.ts      # 离线 JWT 验签
│   │   ├── auth-api.ts               # 调用 CloudBase HTTP 云函数
│   │   └── auth-context.tsx          # React Context + useAuth hook
│   ├── app/login/
│   │   └── page.tsx                  # 登录页（静态导出兼容）
│   └── features/auth/
│       └── login-view.tsx            # 登录表单 UI
├── tests/lib/
│   ├── license-validator.test.ts
│   └── device-id.test.ts
└── .env.local.example                # NEXT_PUBLIC_TCB_ENV_ID 等
```

---

## 云数据库表设计

### 集合 `accounts`

| 字段 | 类型 | 说明 |
|------|------|------|
| `_id` | string | 自动生成 |
| `username` | string | 登录名，唯一索引 |
| `passwordHash` | string | bcrypt 哈希 |
| `displayName` | string | 显示名（可选） |
| `deviceId` | string \| null | 当前绑定设备 UUID，null 表示未绑定 |
| `boundAt` | number \| null | 绑定时间戳 ms |
| `disabled` | boolean | 是否禁用，默认 false |
| `createdAt` | number | 创建时间 ms |
| `createdBy` | string | 管理员标识 |

**索引：** `username` 唯一

### 集合 `admin_tokens`（可选，MVP 可不用）

MVP 阶段管理员鉴权用云函数环境变量 `ADMIN_SECRET`，请求头 `X-Admin-Secret` 校验即可，无需额外表。

---

## 环境变量

### CloudBase 云函数环境变量（控制台配置）

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `JWT_PRIVATE_KEY` | RSA 私钥 PEM（换行用 `\n`） | `-----BEGIN PRIVATE KEY-----\n...` |
| `ADMIN_SECRET` | 管理员 API 密钥 | 随机 32 字符 |
| `LICENSE_EXPIRY_YEARS` | License 有效期年数 | `10` |

### PWA 客户端（`.env.local` / 构建时注入）

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `NEXT_PUBLIC_TCB_ENV_ID` | CloudBase 环境 ID | 是 |
| `NEXT_PUBLIC_AUTH_API_BASE` | 云函数 HTTP 访问根 URL | 是 |
| `NEXT_PUBLIC_JWT_PUBLIC_KEY` | RSA 公钥 PEM（验签用） | 是 |

---

## Task 1：生成 RSA 密钥对

**Files:**
- Create: `cloudbase/keys/private.pem`（gitignore）
- Create: `cloudbase/keys/public.pem`（可提交，将内嵌到客户端）
- Modify: `.gitignore` — 添加 `cloudbase/keys/private.pem`

**Step 1:** 生成密钥

```bash
mkdir -p cloudbase/keys
openssl genrsa -out cloudbase/keys/private.pem 2048
openssl rsa -in cloudbase/keys/private.pem -pubout -out cloudbase/keys/public.pem
```

**Step 2:** 确认 `public.pem` 不含私钥，`private.pem` 已 gitignore

Expected: 两个 PEM 文件存在，私钥不在 git 追踪中

---

## Task 2：CloudBase 环境与数据库

**前置：** 在 [CloudBase 控制台](https://console.cloud.tencent.com/tcb) 创建环境（免费体验版即可）

**Step 1:** 创建集合 `accounts`

**Step 2:** 为 `username` 字段创建唯一索引

**Step 3:** 记录环境 ID 写入 `.env.local`:

```
NEXT_PUBLIC_TCB_ENV_ID=your-env-id
```

**Step 4:** 在云函数环境变量中配置 `JWT_PRIVATE_KEY`、`ADMIN_SECRET`

Expected: 控制台可见 `accounts` 集合，环境 ID 已记录

---

## Task 3：云函数 `auth-login`

**Files:**
- Create: `cloudbase/functions/auth-login/index.js`
- Create: `cloudbase/functions/auth-login/package.json`

**依赖:** `@cloudbase/node-sdk`、`bcryptjs`、`jose`

**Step 1: Write the failing test（客户端验签测试，Task 5 先写）**

本 Task 先用 curl 手动验证，自动化测试在 Task 5/6。

**Step 2: 实现 `auth-login`**

```javascript
/**
 * POST /auth-login
 * Body: { username, password, deviceId }
 * Response: { license, username, displayName }
 * Errors: 401 账密错误 | 403 账号禁用 | 409 已在其他设备登录
 */
```

核心逻辑：
1. 查 `accounts` where `username`
2. 不存在或 `bcrypt.compare` 失败 → 401
3. `disabled === true` → 403
4. `deviceId` 非空且不等于请求的 `deviceId` → 409
5. 若 `deviceId` 为空或等于请求 `deviceId`：更新 `deviceId`、`boundAt`
6. 用 `jose.SignJWT` + 私钥签发 payload `{ sub, username, deviceId }`，exp = 10 年
7. 返回 `{ license, username, displayName }`

**Step 3: 部署**

```bash
# 安装 CloudBase CLI 后
tcb fn deploy auth-login -e your-env-id
```

**Step 4: 手动测试**

```bash
curl -X POST "https://your-env.ap-shanghai.tcb-api.tencentcloudapi.com/auth-login" \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","deviceId":"device-uuid-1"}'
```

Expected: 首次返回 401（账号未创建）；创建账号后返回 `{ license: "eyJ..." }`

---

## Task 4：云函数 `auth-admin`

**Files:**
- Create: `cloudbase/functions/auth-admin/index.js`
- Create: `cloudbase/functions/auth-admin/package.json`

**依赖:** `@cloudbase/node-sdk`、`bcryptjs`

**路由（同一云函数，按 `action` 字段分发）：**

| action | 说明 | Body |
|--------|------|------|
| `createAccount` | 创建账号 | `{ username, password, displayName? }` |
| `listAccounts` | 列表 | `{}` |
| `disableAccount` | 禁用 | `{ accountId }` |
| `enableAccount` | 启用 | `{ accountId }` |
| `unbindDevice` | 解绑设备 | `{ accountId }` |

**鉴权：** 请求头 `X-Admin-Secret` 必须等于环境变量 `ADMIN_SECRET`，否则 403。

**Step 1:** 实现 `createAccount` — bcrypt hash password，`db.collection('accounts').add(...)`

**Step 2:** 实现其余 action

**Step 3:** 部署并手动创建测试账号

```bash
curl -X POST ".../auth-admin" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your-admin-secret" \
  -d '{"action":"createAccount","username":"teacher01","password":"Pass1234","displayName":"张老师"}'
```

Expected: 返回 `{ accountId, username }`；数据库有记录

---

## Task 5：客户端 — deviceId 与 License 存储

**Files:**
- Create: `src/lib/auth/device-id.ts`
- Create: `src/lib/auth/license-store.ts`
- Create: `tests/lib/device-id.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/lib/device-id.test.ts
import { describe, expect, it, beforeEach, vi } from "vitest";
import { getOrCreateDeviceId, DEVICE_ID_KEY } from "@/lib/auth/device-id";

describe("getOrCreateDeviceId", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(k: string) { return this.store[k] ?? null; },
      setItem(k: string, v: string) { this.store[k] = v; },
    });
  });

  it("creates and persists a UUID on first call", () => {
    const id1 = getOrCreateDeviceId();
    expect(id1).toMatch(/^[0-9a-f-]{36}$/);
    expect(localStorage.getItem(DEVICE_ID_KEY)).toBe(id1);
  });

  it("returns same id on subsequent calls", () => {
    const id1 = getOrCreateDeviceId();
    const id2 = getOrCreateDeviceId();
    expect(id2).toBe(id1);
  });
});
```

**Step 2: Run test**

Run: `npm test -- tests/lib/device-id.test.ts`
Expected: FAIL（module not found）

**Step 3: Implement `device-id.ts`**

```typescript
/** localStorage key for persistent device identifier */
export const DEVICE_ID_KEY = "ht.deviceId";

/** Returns existing deviceId or creates a new UUID v4 and persists it. */
export function getOrCreateDeviceId(): string { /* ... */ }
```

**Step 4: Implement `license-store.ts`**

```typescript
const LICENSE_KEY = "ht.license";
const LICENSE_META_KEY = "ht.licenseMeta"; // { username, displayName }

export function saveLicense(license: string, meta: { username: string; displayName?: string }): void;
export function getLicense(): string | null;
export function getLicenseMeta(): { username: string; displayName?: string } | null;
export function clearLicense(): void;
```

**Step 5: Run tests**

Run: `npm test -- tests/lib/device-id.test.ts`
Expected: PASS

---

## Task 6：客户端 — 离线 License 验签

**Files:**
- Create: `src/lib/auth/license-validator.ts`
- Create: `tests/lib/license-validator.test.ts`
- Modify: `package.json` — 添加 `jose` 依赖

**Step 1: Write the failing test**

```typescript
import { describe, expect, it } from "vitest";
import { SignJWT, importPKCS8 } from "jose";
import { validateLicense } from "@/lib/auth/license-validator";

// 测试用：用固定密钥对签发 token，验签函数用对应公钥
describe("validateLicense", () => {
  it("returns payload when token is valid and deviceId matches", async () => {
    // 签发 → validateLicense → expect { sub, username, deviceId }
  });

  it("returns null when deviceId mismatch", async () => { /* ... */ });
  it("returns null when token expired", async () => { /* ... */ });
  it("returns null when token malformed", async () => { /* ... */ });
});
```

**Step 2: Run test → FAIL**

**Step 3: Implement `license-validator.ts`**

```typescript
export interface LicensePayload {
  sub: string;
  username: string;
  deviceId: string;
}

/**
 * Offline-validates a License JWT against embedded public key and deviceId.
 * Returns payload or null if invalid/expired/device mismatch.
 */
export async function validateLicense(
  license: string,
  currentDeviceId: string,
): Promise<LicensePayload | null> { /* jose jwtVerify */ }
```

公钥从 `process.env.NEXT_PUBLIC_JWT_PUBLIC_KEY` 读取。

**Step 4: Run test → PASS**

Run: `npm test -- tests/lib/license-validator.test.ts`

---

## Task 7：客户端 — Auth API 与 Context

**Files:**
- Create: `src/lib/auth/auth-api.ts`
- Create: `src/lib/auth/auth-context.tsx`
- Modify: `src/features/common/app-shell.tsx`

**Step 1: Implement `auth-api.ts`**

```typescript
export class AuthApiError extends Error {
  constructor(message: string, public code: "NETWORK" | "UNAUTHORIZED" | "FORBIDDEN" | "CONFLICT") {
    super(message);
  }
}

/** Calls CloudBase auth-login. Requires network. */
export async function login(username: string, password: string, deviceId: string): Promise<{
  license: string;
  username: string;
  displayName?: string;
}> { /* fetch POST */ }
```

错误映射：
- HTTP 401 → `UNAUTHORIZED`「用户名或密码错误」
- HTTP 403 → `FORBIDDEN`「账号已禁用，请联系管理员」
- HTTP 409 → `CONFLICT`「该账号已在其他设备登录，请联系管理员解绑」
- fetch 失败 → `NETWORK`「请检查网络连接后重试」

**Step 2: Implement `auth-context.tsx`**

```typescript
type AuthStatus = "loading" | "authorized" | "unauthorized";

interface AuthState {
  status: AuthStatus;
  username: string | null;
  displayName: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element;
export function useAuth(): AuthState;
```

`AuthProvider` 启动逻辑：
1. `status = "loading"`
2. 读 localStorage license + deviceId
3. `validateLicense(license, deviceId)` 成功 → `authorized`
4. 否则 → `unauthorized`

`login()` 逻辑：
1. `getOrCreateDeviceId()`
2. `authApi.login(...)`
3. `saveLicense(...)` → `authorized`

`logout()` 逻辑：
1. `clearLicense()` → `unauthorized`（不清 deviceId，不调用服务端）

**Step 3: Modify `app-shell.tsx`**

```tsx
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AppContainerProvider>
        {/* ... existing providers ... */}
        <AuthGate>{/* ShellInner */}</AuthGate>
      </AppContainerProvider>
    </AuthProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === "loading") return <div className="bootstrap-loading">正在验证…</div>;
  if (status === "unauthorized") return <LoginView />;
  return <ShellInner>{children}</ShellInner>;
}
```

**Step 4:** 确认未授权时不挂载 `DataStoreProvider` 内的数据加载（可选：保持挂载但登录页不触发，当前 `AppContainerProvider` 在 authorized 内即可）

Expected: 无 License 时只看到登录页

---

## Task 8：登录页 UI

**Files:**
- Create: `src/features/auth/login-view.tsx`
- Create: `src/app/login/page.tsx`（可选，AuthGate 已内嵌 LoginView；page 仅 redirect 或备用）

**Step 1: Implement `login-view.tsx`**

复用组件：`IOSFormSection`、`IOSFormRow`、`IOSButton`、`useToast`

布局：
- 顶部大标题「班主任留痕」
- 副标题「请登录后使用」
- 分组表单：用户名、密码（`type="password"`）
- 底部 `IOSButton variant="filled" fullWidth`「登录」
- loading 时按钮 disabled + 文案「登录中…」

**Step 2:** 调用 `useAuth().login(username, password)`，catch `AuthApiError` 显示 Toast

**UI 验收：** 与 `.ios-form-section` 风格一致，padding 16px

---

## Task 9：「我的」页账号信息

**Files:**
- Modify: `src/features/views/mine-view.tsx`

**Step 1:** 在班级信息 Section 上方新增 Section「账号」

```tsx
const { username, displayName, logout } = useAuth();
// IOSFormSection title="账号"
// IOSFormRow label="用户名" value={displayName ?? username}
// IOSActionRow label="退出登录" destructive onClick={logout}
```

**Step 2:** 退出后应回到登录页（AuthGate 自动处理）

Expected: 「我的」页可见用户名，退出后显示登录页

---

## Task 10：环境变量与 README

**Files:**
- Create: `.env.local.example`
- Modify: `README.md`

**Step 1:** 创建 `.env.local.example` 含三个 `NEXT_PUBLIC_*` 变量及说明

**Step 2:** README 新增章节：

```markdown
## 账号登录（CloudBase）

首次使用需联网登录。登录后当前设备离线可用。一个账号仅绑定一台设备。

### 环境变量

| 变量 | 说明 |
|------|------|
| NEXT_PUBLIC_TCB_ENV_ID | CloudBase 环境 ID |
| NEXT_PUBLIC_AUTH_API_BASE | 云函数 HTTP 访问地址 |
| NEXT_PUBLIC_JWT_PUBLIC_KEY | License 验签公钥 |

### 管理员操作

通过 curl 或 Postman 调用 `auth-admin` 云函数（需 X-Admin-Secret 头）：
- 创建账号、禁用账号、解绑设备

详见 docs/plans/2026-07-27-cloudbase-auth-gate.md
```

---

## Task 11：CloudBase 部署与 PWA 联调

**Step 1:** 部署两个云函数，开启 HTTP 访问

**Step 2:** 配置 `.env.local`，本地 `npm run dev` 测试完整登录流程

**Step 3:** 测试用例清单（手动）

| # | 场景 | 预期 |
|---|------|------|
| 1 | 无 License 打开 App | 显示登录页 |
| 2 | 错误密码 | Toast「用户名或密码错误」 |
| 3 | 正确密码首次登录 | 进入工作台，刷新仍可用（离线） |
| 4 | 同账号另一 deviceId 登录 | 409，提示已在其他设备登录 |
| 5 | 管理员 unbindDevice 后原设备 | 仍可用（License 仍有效） |
| 6 | unbind 后新设备登录 | 成功 |
| 7 | 断网后打开 App | 已登录用户正常进入 |
| 8 | 退出登录 | 回登录页，需联网才能再登录 |
| 9 | 禁用账号后尝试登录 | 403 提示 |

**Step 4:** 生产构建

```bash
npm run build
# 将 out/ 部署到 CloudBase 静态托管或现有 CDN
```

Expected: 全流程通过

---

## Task 12（可选）：管理员 Web 页面

**YAGNI 原则：** MVP 阶段用 curl 管理账号即可。若需要 GUI：

**Files:**
- Create: `src/app/admin/page.tsx`（独立路由，不加入 TabBar）
- 表单输入 Admin Secret + 操作类型
- 仅在内网或特定部署环境启用

不在 MVP 范围内，后续迭代再加。

---

## 安全注意事项

1. `JWT_PRIVATE_KEY` 仅存 CloudBase 云函数环境变量，不进 git
2. `ADMIN_SECRET` 足够随机（≥32 字符），不硬编码在客户端
3. 客户端公钥泄露不影响安全（只能验签，不能伪造）
4. License 绑定 `deviceId` claim，换设备 Token 无效
5. CloudBase 数据库安全规则：仅云函数可读写 `accounts`（客户端不直连数据库）

---

## 实施顺序总览

```
Task 1  密钥对
Task 2  CloudBase 环境
Task 3  auth-login 云函数
Task 4  auth-admin 云函数
Task 5  deviceId + license-store（TDD）
Task 6  license-validator（TDD）
Task 7  auth-api + context + app-shell 守卫
Task 8  登录页 UI
Task 9  我的页账号信息
Task 10 环境变量 + README
Task 11 部署联调
```

---

## 预估工作量

| 阶段 | 时间 |
|------|------|
| CloudBase 搭建 + 云函数 | 3–4 小时 |
| 客户端 auth 模块（TDD） | 2–3 小时 |
| UI + 联调 | 1–2 小时 |
| **合计** | **约 1 个工作日** |
