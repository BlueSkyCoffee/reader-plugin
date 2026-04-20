# Reader

<p align="center">
  <strong>一款现代化的网页小说阅读器浏览器扩展</strong>
</p>

<p align="center">
  支持 Chrome / Edge | 小说搜索与抓取 | 离线阅读 | EPUB 导出
</p>

---

## 功能特性

- **多源支持** — 内置 bilinovel.com、wenku8.net 解析器，支持自定义规则扩展
- **智能抓取** — 通用爬虫引擎，通过配置规则适配更多小说站点
- **离线阅读** — 基于 IndexedDB 的本地存储，支持章节缓存
- **EPUB 导出** — 一键生成标准 EPUB 格式电子书
- **沉浸阅读** — 内置阅读器支持滚动定位、样式自定义
- **国际化** — 中英文双语界面

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | [Wxt](https://wxt.dev/) + Vite |
| UI | React 19 + React Router 7 |
| 样式 | Tailwind CSS v4 + shadcn/ui |
| 状态 | Jotai |
| 存储 | Dexie (IndexedDB) |
| 校验 | Zod + Valibot |
| 测试 | Vitest + Playwright |

## 快速开始

### 环境要求

- Node.js 18+
- pnpm 8+

### 安装

```bash
# 克隆仓库
git clone <repo-url>
cd web-novel-new

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

### 加载扩展

1. 打开 Chrome/Edge，访问 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择项目根目录下的 `.output/chrome-mv3` 文件夹

## 开发命令

```bash
# 开发
pnpm dev              # Chrome 开发模式
pnpm dev:firefox      # Firefox 开发模式

# 构建
pnpm build            # 生产构建 (Chrome)
pnpm build:firefox    # 生产构建 (Firefox)
pnpm zip              # 打包 Chrome 扩展
pnpm zip:firefox      # 打包 Firefox 扩展

# 质量检查
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm type-check       # TypeScript 类型检查

# 测试
pnpm test             # 运行单元测试
pnpm test:watch       # 监听模式
pnpm test:cov         # 测试覆盖率
```

## 项目结构

```
src/
├── entrypoints/          # 扩展入口点
│   ├── background/       # Service Worker (消息处理)
│   ├── content/          # 内容脚本 (页面内阅读器)
│   ├── popup/            # 弹出窗口 (快捷入口)
│   └── options/          # 选项页 (完整应用)
├── features/             # 功能模块
│   ├── bookshelf/        # 书架管理
│   ├── download/         # 下载管理
│   ├── lightnovel/       # 小说源解析
│   ├── reader/           # 阅读器
│   ├── rules/            # 爬虫规则
│   ├── search/           # 搜索功能
│   └── settings/         # 设置
├── shared/               # 共享模块
│   ├── components/       # UI 组件
│   ├── contracts/        # 消息类型定义
│   ├── db/               # 数据库配置
│   ├── hooks/            # React Hooks
│   ├── i18n/             # 国际化
│   ├── infra/            # 基础设施
│   └── state/            # 状态管理
├── types/                # TypeScript 类型
└── _locales/             # i18n 翻译文件
    ├── zh_CN/
    └── en/
```

## 架构设计

项目遵循**工程化收敛**原则：

- **单一数据模型** — 类型定义集中在 `src/types/`
- **单一消息协议** — `ExtensionProtocolMap` 定义跨上下文通信
- **单一存储实现** — `StorageManager` 统一 IndexedDB + browser.storage
- **清晰边界** — `entrypoints/` (入口) 与 `features/` (业务) 分离

### 消息通信

使用 `@webext-core/messaging` 实现跨上下文通信：

```typescript
// 前台发送消息
const result = await requestMessage('fetchHtml', { url });

// 后台注册处理器
registerHandlers({
  fetchHtml: async ({ url }) => { ... }
});
```

### 数据存储

- **IndexedDB** (`ReaderDB`): 存储 `books`、`chapters`、`rules`、`metadata`、`downloads`
- **browser.storage.local**: 用户设置 (`reader:app-settings`)

## 扩展小说源

通过自定义 `ScraperRule` 可支持更多小说站点：

```typescript
interface ScraperRule {
  id: string;
  name: string;
  domain: string;
  search: SearchConfig;    // 搜索页选择器
  book: BookConfig;        // 书籍页选择器
  chapter: ChapterConfig;  // 章节选择器
}
```

规则存储在 IndexedDB 中，可在扩展设置页面管理。

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT