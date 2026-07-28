# CloudBase 账号门禁部署说明

## 1. 创建环境

1. 打开 [CloudBase 控制台](https://console.cloud.tencent.com/tcb)
2. 确认环境 ID（示例：`homeroom-trace-d6govo66p082c0347`）
3. `cloudbase/cloudbaserc.json` 中的 `envId` 已对齐该环境

## 2. 创建数据库

1. 进入「文档型数据库」→ 创建集合 `accounts`
2. 权限选择 **无权限 [ADMINONLY]**
3. 为 `username` 字段添加**唯一索引**

## 3. 部署云函数（先做这步）

> 环境变量要在**函数创建之后**才能配，所以先部署函数，再配变量。

### 3.1 安装 CLI 并登录

```bash
cd cloudbase
npm install
npx tcb login
```

### 3.2 部署两个函数

```bash
npm run deploy
```

或分步：

```bash
npm run deploy:login
npm run deploy:admin
```

`npm run deploy` 会自动执行 `scripts/prepare-cloudbaserc-env.mjs`，将密钥写入 **gitignore** 的 `cloudbaserc.deploy.json` 后再部署。

### 3.3 开启 HTTP 访问

```bash
npx tcb service create --envId homeroom-trace-d6govo66p082c0347 --service-path auth-login --function auth-login
npx tcb service create --envId homeroom-trace-d6govo66p082c0347 --service-path auth-admin --function auth-admin
```

HTTP 根 URL（已创建）：

`https://homeroom-trace-d6govo66p082c0347-1302493111.ap-shanghai.app.tcloudbase.com`

## 4. 环境变量

由 `npm run prepare-env` 自动从 `keys/private.pem` 和 `secrets.local.json` 注入到 `cloudbaserc.deploy.json`，随部署一并上传。

首次运行 `prepare-env` 会生成 `secrets.local.json`（含 `ADMIN_SECRET`），请妥善保存。

也可在控制台手动配置：**函数管理 → 点函数名 → 函数配置 → 环境变量**。

## 5. 管理员 Web 后台

浏览器访问：**http://localhost:3000/admin**（生产环境同理 `/admin`）

管理员账号密码保存在 `cloudbase/secrets.local.json`：

- `ADMIN_USERNAME`（默认 `admin`）
- `ADMIN_PASSWORD`

后台功能：查看全部账号状态（可用 / 已绑定设备 / 已禁用）、创建账号、解绑设备、禁用/启用账号。

## 6. 创建首个账号（curl，可选）

```bash
curl -X POST "https://YOUR_BASE/auth-admin" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d "{\"action\":\"createAccount\",\"username\":\"teacher01\",\"password\":\"Pass1234\",\"displayName\":\"张老师\"}"
```

## 6. 管理员常用操作

**列出账号：**
```bash
curl -X POST "https://YOUR_BASE/auth-admin" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d "{\"action\":\"listAccounts\"}"
```

**解绑设备（换机/清缓存后重新登录）：**
```bash
curl -X POST "https://YOUR_BASE/auth-admin" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d "{\"action\":\"unbindDevice\",\"accountId\":\"ACCOUNT_ID\"}"
```

**禁用账号：**
```bash
curl -X POST "https://YOUR_BASE/auth-admin" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -d "{\"action\":\"disableAccount\",\"accountId\":\"ACCOUNT_ID\"}"
```

## 7. PWA 客户端环境变量

**默认配置已写入 `cloudbase/client-config.json`**（与 JWT 公钥一样在 `next build` 时注入），本地开发与 CI/CloudBase 部署无需再配 `.env.local` 即可登录。

如需覆盖（多环境部署），复制 `.env.local.example` 为 `.env.local` 并填写：

- `NEXT_PUBLIC_TCB_ENV_ID` — 默认见 `client-config.json`
- `NEXT_PUBLIC_AUTH_API_BASE` — 默认见 `client-config.json`（HTTP 根 URL，见上文 §3.3）
- `NEXT_PUBLIC_JWT_PUBLIC_KEY` — 已由 `next.config.ts` 从 `cloudbase/keys/public.pem` 注入，一般无需填写

然后：

```bash
npm run dev
# 或
npm run build
```

## 8. GitHub Actions 自动部署

Push 到 `main` 后，`.github/workflows/deploy-cloudbase.yml` 会自动构建并通过 **`tcb app deploy`** 发布到 CloudBase 应用 `homeroom-trace`（会生成新的部署版本记录）。

> 注意：不要使用 `tcb hosting deploy`，它只上传静态文件，不会更新「应用详情 → 部署版本」列表。

在 GitHub 仓库 **Settings → Secrets and variables → Actions** 配置：

| Secret | 值 |
|--------|-----|
| `TCB_SECRET_ID` | 腾讯云 [API 密钥 SecretId](https://console.cloud.tencent.com/cam/capi)（以 `AKID` 开头） |
| `TCB_SECRET_KEY` | 对应的 SecretKey |
| `TCB_ENV_ID` | `homeroom-trace-d6govo66p082c0347` |
| `NEXT_PUBLIC_AUTH_API_BASE` | （可选）覆盖 `cloudbase/client-config.json` 中的 HTTP 根 URL |

注意：`TCB_SECRET_ID` 填 SecretId，不要与 SecretKey 或环境 ID 混淆。子账号密钥需有 CloudBase 权限（如 `QCloudTCBFullAccess`）。

若未配置 `NEXT_PUBLIC_AUTH_API_BASE` Secret，构建会使用仓库内 `cloudbase/client-config.json` 的默认值。

## 常见问题

**Q：找不到「云函数 → 环境变量」？**  
A：必须先部署函数。函数列表为空时，没有可配置的环境变量入口。按第 3 步部署后再进函数详情页配置。

**Q：控制台提示去「新版开发平台」？**  
A：可点击前往新版，路径变为：云函数 → 函数列表 → 点函数名 → 配置 → 环境变量。
