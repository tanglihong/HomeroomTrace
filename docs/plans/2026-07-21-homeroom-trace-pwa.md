# 班主任工作留痕 PWA Implementation Plan

> **For Cursor:** REQUIRED SUB-SKILL: Use tinet-test-driven-development to implement this plan task-by-task.

**Goal:** 在 `PWA/` 目录从零搭建 Next.js PWA，完整复刻 iOS 版 HomeroomTrace 全部功能（P0–P3），纯本地离线，可安装，Workbox 离线缓存。

**Architecture:** Next.js App Router + Client Components；分层 `src/features` → `src/domain` → `src/data`（对齐 iOS）；Dexie.js（IndexedDB）持久化；媒体 Blob 存 IndexedDB；React Context 作 DI 容器；`@ducanh2912/next-pwa` 集成 Workbox。

**Tech Stack:** Next.js、TypeScript、Dexie.js、jsPDF、JSZip、Vitest、@ducanh2912/next-pwa（Workbox）。UI 用 CSS 变量还原 iOS 分组列表风格，无第三方 UI 库。

**非功能：** 与 iOS 一致——纯本地、无 API；用户错误 Toast/Alert；空列表 CTA；导出可脱敏手机号；备份含 DB + 媒体。

---

## UI 基线（对齐 iOS）

| 属性 | 值 |
|------|-----|
| 页面水平 padding | 16px |
| 分组列表背景 | `#F2F2F7` |
| 卡片/行背景 | `#FFFFFF` |
| 强调色 | `#007AFF` |
| 字体 | `-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif` |
| Tab 栏高度 | 49px + safe-area-inset-bottom |
| 导航栏高度 | 44px + safe-area-inset-top |
| 工作台网格 | 2 列，gap 12px |
| 圆角（卡片/按钮） | 10px / 12px |
| 列表行高 | min 44px |

**UI 验收清单：**
- [ ] 底部 4 Tab 固定，图标+文字，选中态 `#007AFF`
- [ ] 列表为 iOS grouped inset 风格（白卡片浮于灰底）
- [ ] 表单页大标题 + 分组字段
- [ ] Sheet 自底部滑入（modal）
- [ ] Toast 顶部居中，2 秒消失

---

## 目录结构

```
PWA/
├── public/
│   ├── manifest.webmanifest
│   └── icons/                    # 192, 512 PNG
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 根布局、Providers、TabShell
│   │   ├── page.tsx                # redirect → /workbench
│   │   ├── workbench/page.tsx
│   │   ├── students/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── import/page.tsx
│   │   │   └── new/page.tsx
│   │   ├── records/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── grades/
│   │   │   ├── page.tsx
│   │   │   ├── import/page.tsx
│   │   │   └── [sheetId]/insight/page.tsx
│   │   ├── mine/
│   │   │   ├── page.tsx
│   │   │   └── export/page.tsx
│   │   └── students/[id]/
│   │       ├── attendance/page.tsx
│   │       └── behavior/page.tsx
│   ├── domain/                   # 纯 TS，无 React
│   │   ├── models/
│   │   ├── analysis/grade-analyzer.ts
│   │   ├── import/
│   │   ├── privacy/privacy-redactor.ts
│   │   └── use-cases/repositories.ts  # 接口 + DTO
│   ├── data/
│   │   ├── db/schema.ts          # Dexie tables
│   │   ├── db/database.ts
│   │   ├── repositories/         # 各 Repository 实现
│   │   ├── storage/media-store.ts
│   │   └── export/
│   │       ├── ledger-pdf-exporter.ts
│   │       └── backup-service.ts
│   ├── features/                 # UI 组件
│   │   ├── common/               # Toast, Loading, IOSList, IOSSheet
│   │   ├── workbench/
│   │   ├── records/
│   │   ├── students/
│   │   ├── grades/
│   │   ├── attendance-behavior/
│   │   └── mine/
│   ├── lib/
│   │   └── app-container.tsx     # React Context DI
│   └── styles/
│       ├── globals.css           # iOS tokens
│       └── ios-components.css
├── tests/
│   └── domain/                   # Vitest 对标 iOS 单测
├── next.config.ts
├── package.json
└── README.md
```

---

## 分期任务（一次性交付，按依赖顺序）

### Task 1: Next.js 工程脚手架

**Files:**
- Create: `PWA/package.json`, `PWA/tsconfig.json`, `PWA/next.config.ts`, `PWA/.gitignore`
- Create: `PWA/src/app/layout.tsx`, `PWA/src/app/page.tsx`
- Create: `PWA/src/styles/globals.css`

**Step 1:** `npx create-next-app@latest` 等价手动创建（App Router, TS, ESLint, no Tailwind）

**Step 2:** 安装依赖：
```bash
npm install dexie uuid jspdf jszip
npm install -D vitest @vitejs/plugin-react @types/uuid
npm install @ducanh2912/next-pwa
```

**Step 3:** 配置 `next.config.ts` 包裹 `@ducanh2912/next-pwa`（`dest: 'public'`, `register: true`, `skipWaiting: true`, runtimeCaching for app shell）

**Step 4:** 创建 `public/manifest.webmanifest`（name: 班主任留痕, display: standalone, theme_color: #007AFF）

**Step 5:** `npm run dev` 验证启动

---

### Task 2: Domain 层移植（纯逻辑 + 测试）

**Files:**
- Create: `src/domain/models/work-record-type.ts` — 移植 `WorkRecordType` + `RecordTypeConfig`
- Create: `src/domain/use-cases/repositories.ts` — 全部 DTO、Filter、接口
- Create: `src/domain/import/student-csv-parser.ts`
- Create: `src/domain/import/grade-csv-parser.ts`
- Create: `src/domain/analysis/grade-analyzer.ts`
- Create: `src/domain/privacy/privacy-redactor.ts`
- Test: `tests/domain/*.test.ts`

**Step 1:** 写 Vitest 失败测试（对标 iOS `GradeAnalyzerTests`, `StudentCSVParserTests`, `GradeCSVParserTests`, `PrivacyRedactorTests`, `RecordTypeConfigTests`）

**Step 2:** 实现最小逻辑使测试通过

**Step 3:** `npm test` 全绿

---

### Task 3: Dexie 数据层 + Repository

**Files:**
- Create: `src/data/db/schema.ts` — 9 张表映射 SwiftData 实体
- Create: `src/data/db/database.ts` — Dexie 单例 + 版本迁移
- Create: `src/data/storage/media-store.ts` — Blob 存 `mediaFiles` 表
- Create: `src/data/repositories/*.ts` — Class, Student, WorkRecord, Grade, Attendance, Behavior, Template
- Test: `tests/data/persistence.test.ts`, `tests/data/work-record-repository.test.ts`

**实体字段：** 与 iOS `Models.swift` 一一对应（UUID 用 string）

**TemplateRepository.seedDefaultsIfNeeded：** 首次启动写入 10 套默认模板

---

### Task 4: AppContainer DI + Bootstrap

**Files:**
- Create: `src/lib/app-container.tsx` — React Context，对标 `AppContainer.swift`
- Create: `src/features/common/bootstrap-gate.tsx` — 异步 init DB + 默认班级

**逻辑：**
1. 打开 App → init Dexie → seed templates → ensureDefaultClass
2. `useAppContainer()` hook 暴露 repositories + `requireClassId`

---

### Task 5: iOS 风格 UI 基础组件

**Files:**
- Create: `src/styles/ios-components.css`
- Create: `src/features/common/ios-list.tsx` — Grouped List / Row / Section
- Create: `src/features/common/ios-nav-bar.tsx`
- Create: `src/features/common/tab-bar.tsx` — 4 Tab 固定底栏
- Create: `src/features/common/toast.tsx`
- Create: `src/features/common/loading-overlay.tsx`
- Create: `src/features/common/ios-sheet.tsx`
- Modify: `src/app/layout.tsx` — TabBar + ToastProvider + AppContainerProvider

---

### Task 6: 工作台 Tab

**Files:**
- Create: `src/app/workbench/page.tsx`
- Create: `src/features/workbench/workbench-view.tsx`

**功能：**
- 2 列网格 10 种留痕快捷入口 → `/records/new?type=xxx`
- 最近 10 条留痕列表
- 「查看全部」→ `/records`

---

### Task 7: 留痕 CRUD（含附件）

**Files:**
- Create: `src/app/records/page.tsx` — 列表 + 筛选（类型/日期/关键词）
- Create: `src/app/records/new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`
- Create: `src/features/records/record-editor.tsx`
- Create: `src/features/records/record-detail.tsx`
- Create: `src/features/media/audio-recorder.ts` — MediaRecorder API
- Create: `src/features/media/photo-picker.tsx` — file input

**逻辑：** `RecordTypeConfig` 动态字段；模板选择填充正文；照片/录音 → MediaStore → AttachmentDraft

---

### Task 8: 学生 Tab

**Files:**
- Create: `src/app/students/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `import/page.tsx`
- Create: `src/features/students/*.tsx`

**功能：** CRUD、搜索、CSV 导入、标签编辑、详情页快捷入口（考勤/奖惩/关联留痕）

---

### Task 9: 考勤与奖惩

**Files:**
- Create: `src/app/students/[id]/attendance/page.tsx`
- Create: `src/app/students/[id]/behavior/page.tsx`
- Create: `src/features/attendance-behavior/*.tsx`

---

### Task 10: 成绩学情 Tab

**Files:**
- Create: `src/app/grades/page.tsx`, `import/page.tsx`, `[sheetId]/insight/page.tsx`
- Create: `src/features/grades/*.tsx`

**功能：** 成绩表列表、CSV 导入（校验学号）、导入结果页、学情简报（GradeAnalyzer）

---

### Task 11: 我的 Tab — 导出与备份

**Files:**
- Create: `src/app/mine/page.tsx`, `export/page.tsx`
- Create: `src/data/export/ledger-pdf-exporter.ts` — jsPDF
- Create: `src/data/export/backup-service.ts` — JSZip（Dexie export JSON + media blobs）
- Create: `src/features/mine/*.tsx`

**功能：**
- 班级信息编辑
- PDF 台账（日期范围、脱敏选项 → PrivacyRedactor）
- 备份 ZIP 下载 / 还原（file input → 覆盖 DB + media，提示刷新）

---

### Task 12: PWA 收尾

**Files:**
- Modify: `next.config.ts` — Workbox runtimeCaching（NetworkFirst for navigation, CacheFirst for static）
- Create: `public/icons/icon-192.png`, `icon-512.png`
- Modify: `src/app/layout.tsx` — viewport theme-color, apple-mobile-web-app meta
- Create: `PWA/README.md`

**验证：**
- Lighthouse PWA 审计通过（installable, offline）
- 断网后已缓存页面可访问
- 杀进程/关标签再开，IndexedDB 数据仍在

---

### Task 13: 单元测试全量回归

**Run:** `npm test`

**覆盖：** domain 全测 + data 核心仓储测试（对标 iOS HomeroomTraceTests）

---

## DRY 归属（对齐 iOS）

| 逻辑 | 唯一归属 |
|------|----------|
| 班级上下文 | `AppContainer` / `useAppContainer` |
| 表单字段配置 | `RecordTypeConfig` |
| 媒体路径 | `MediaStore` |
| 成绩分析 | `GradeAnalyzer` |
| PDF | `LedgerPDFExporter` |
| 脱敏 | `PrivacyRedactor` |
| CSV 解析 | `StudentCSVParser` / `GradeCSVParser` |

---

## 调试流程

1. `cd PWA && npm install && npm run dev`
2. 浏览器 DevTools → Application → IndexedDB 检查数据
3. DevTools → Service Workers 验证 Workbox
4. 回归：建学生 → 各类型留痕（含照片/录音）→ 搜索 → 导入成绩看简报 → 导出 PDF/备份 → `npm test` 全绿
5. 手机 Chrome/Safari「添加到主屏幕」验证 standalone 模式

---

## 与 iOS 差异说明（Web 限制）

| 能力 | PWA 方案 |
|------|----------|
| 录音 | MediaRecorder（需 HTTPS 或 localhost） |
| 分享 PDF/ZIP | Blob URL download + Web Share API（支持时） |
| 备份还原 | 需整页刷新 re-init Dexie |
| 相册 | `<input accept="image/*">` |
