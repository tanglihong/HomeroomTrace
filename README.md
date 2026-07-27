# 班主任工作留痕 PWA

纯本地离线 PWA：学生名册、德育/工作留痕（含照片与录音）、成绩导入与本地学情分析、考勤奖惩、PDF 台账导出与备份。

**账号门禁：** 首次联网登录后，当前设备可离线长期使用；业务数据仍 100% 存于本机 IndexedDB。

## 环境要求

- Node.js 18+
- 现代浏览器（Chrome / Safari / Edge）
- 录音功能需 HTTPS 或 localhost
- 账号登录需配置 CloudBase（见下方）

## 安装与运行

```bash
cd PWA
npm install
cp .env.local.example .env.local   # 填写 CloudBase 配置
npm run dev
```

浏览器打开 http://localhost:3000

## 账号登录（CloudBase）

首次使用需联网登录。登录后当前设备离线可用。一个账号仅绑定一台设备。

### 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_TCB_ENV_ID` | CloudBase 环境 ID |
| `NEXT_PUBLIC_AUTH_API_BASE` | 云函数 HTTP 访问根 URL |
| `NEXT_PUBLIC_JWT_PUBLIC_KEY` | License 验签公钥（`cloudbase/keys/public.pem`） |

部署云函数与管理员操作见 [`cloudbase/README.md`](cloudbase/README.md)。

### 管理员操作

通过 curl 或 Postman 调用 `auth-admin` 云函数（请求头 `X-Admin-Secret`）：

- 创建账号、列出账号、禁用/启用账号、解绑设备

详见 [`docs/plans/2026-07-27-cloudbase-auth-gate.md`](docs/plans/2026-07-27-cloudbase-auth-gate.md)

## 构建与 PWA

```bash
npm run build
npm start
```

生产构建会自动生成 Service Worker（Workbox），支持离线缓存与「添加到主屏幕」。

## 功能入口

| Tab | 内容 |
|-----|------|
| 工作台 | 10 种留痕快捷新建、最近记录 |
| 学生 | 名册 CSV 导入、标签评价、考勤、奖惩、关联留痕 |
| 成绩学情 | CSV 导入（校验名册学号）、本地学情简报 |
| 我的 | 班级信息、PDF 导出（日期范围/脱敏）、备份导出与还原 |

## 测试

```bash
npm test
```

## 架构

`features` → `domain` → `data`；Dexie.js 持久化；Next.js App Router；`@ducanh2912/next-pwa` + Workbox 离线缓存。

对标 iOS 版见 `../ios/README.md`。
