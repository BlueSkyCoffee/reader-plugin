# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Reader** — A Chrome/Edge browser extension built with [Wxt](https://wxt.dev/) for web novel discovery, downloading, EPUB generation, and reading. Supports Chinese web novel sites (bilinovel.com, wenku8.net) with a custom scraper engine for additional sites.

The codebase follows an engineering consolidation pattern:
- Single data model (types in `src/types/`)
- Single message protocol (`ExtensionProtocolMap` in `src/lib/contracts/messages.ts`)
- Single storage implementation (`StorageManager` → `IndexedDBManager` in `src/lib/`)
- Clear entrypoint boundaries (`src/entrypoints/`) vs feature boundaries (`src/features/`)

## Tech Stack

- **Framework**: Wxt (browser extension framework on top of Vite)
- **UI**: React 19 + React Router 7
- **Styling**: Tailwind CSS v4 + shadcn/ui + Radix UI + base-ui
- **State**: Jotai (atom-based state management)
- **Data Fetching**: TanStack Query v5 (with ESLint rules enforced)
- **Database**: Dexie (IndexedDB wrapper) — DB name: `ReaderDB`
- **Validation**: Zod + Valibot
- **i18n**: `@wxt-dev/i18n` (official WXT i18n module) with locale files at `src/locales/`
- **Linting**: ESLint 9 with @antfu/eslint-config
- **Testing**: Vitest + Testing Library, Playwright for E2E (placeholder)
- **Package Manager**: pnpm

## Essential Commands

```bash
# Development
pnpm dev              # Dev server (Chrome, localhost:3000)
pnpm dev:firefox      # Dev server (Firefox)

# Build
pnpm build            # Production build (Chrome)
pnpm build:firefox    # Production build (Firefox)
pnpm zip              # Zip extension for Chrome Web Store
pnpm zip:firefox      # Zip extension for Firefox

# Quality
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint auto-fix
pnpm type-check       # TypeScript type check (no emit)

# Testing
pnpm test             # Run tests once
pnpm test:watch       # Vitest watch mode
pnpm test:cov         # Run with coverage (istanbul)
pnpm test:e2e         # Run Playwright E2E tests (placeholder)

# Run single test file
pnpm test tests/unit/storage.test.ts

# Note: postinstall runs `wxt prepare` — required after fresh install
```

## Architecture

### Directory Structure

```
src/
├── assets/               # Static assets (styles, icons)
├── components/           # UI components
│   ├── ui/               # shadcn/ui primitives
│   ├── app/              # App-specific components
│   ├── layout/           # Layout components (sidebar)
│   ├── providers/        # Context providers (theme)
│   └── settings/         # Settings-related components
├── constants/            # Shared constants (storage keys, routes)
├── entrypoints/          # Wxt extension entrypoints
│   ├── background/       # Service worker (message handlers)
│   ├── content/          # Content script (in-page reader overlay)
│   ├── popup/            # Extension popup (quick access)
│   └── options/          # Options page (full app with routing)
├── features/             # Feature modules (vertical slices)
│   └── <feature>/        # components/, hooks/, pages/, services/
├── hooks/                # Shared React hooks
├── locales/              # i18n: zh_CN.json, en.json (simplified JSON format)
├── lib/                  # Infrastructure
│   ├── contracts/        # Message type definitions
│   ├── db.ts             # Dexie database setup
│   ├── idb.ts            # IndexedDB operations
│   ├── messaging.ts      # Cross-context messaging
│   ├── storage.ts        # Unified storage interface
│   └── epub-*.ts         # EPUB generation services
├── state/                # Jotai atoms
├── types/                # TypeScript types & Zod schemas
├── utils/                # Utility functions (cn, logger, retry, etc.)
public/
tests/
├── unit/                 # Unit tests
├── integration/          # Integration tests
├── e2e/                  # E2E tests (Playwright)
└── fixtures/             # Mock data
```

### Extension Entrypoints

1. **Background** (`src/entrypoints/background/`) — Service worker with `registerHandlers()` for `fetchHtml`, `fetchNovelMetadata`, `fetchNovelCatalog`, `startDownload`.

2. **Content Script** (`src/entrypoints/content/`) — Reader overlay injected into pages (`<all_urls>`), renders in `#reader-root`. Listens for `show-reader` custom events.

3. **Popup** (`src/entrypoints/popup/`) — Quick access links and search.

4. **Options** (`src/entrypoints/options/`) — Full app with sidebar + React Router. Routes: `/` (bookshelf), `/search`, `/downloads`, `/lightnovel`, `/rules`, `/settings/*`, `/reader`.

### Manifest Permissions

- `storage`, `tabs`, `notifications`, `contextMenus`, `scripting`, `activeTab`
- `host_permissions: ["*://*/*"]` — required for scraping arbitrary novel sites

### Cross-Context Messaging

Uses `@webext-core/messaging`. Message contracts in `src/lib/contracts/messages.ts` (`ExtensionProtocolMap`):
- `requestMessage(key, data)` — Send request to background
- `registerHandlers(handlers)` — Register handlers in background

### Data Layer

- **IndexedDB** (`src/lib/db.ts`): `ReaderDB` with tables: `books`, `chapters`, `rules`, `metadata`, `downloads`, `downloadTasks`
- **StorageManager** (`src/lib/storage.ts`): Unified interface for IndexedDB + browser.storage.local
- **Storage Keys** (`src/constants/storage.ts`): `reader:app-settings`, `reader:active-reader-session`

### Novel Sources

- **ParserProvider** (`src/features/lightnovel/services/parser/provider.ts`): Built-in parsers for `bili` (bilinovel.com) and `wenku` (wenku8.net). Each parser implements `BaseParser` interface with `fetchMetadata`, `fetchCatalog`, `fetchChapter` methods.

- **ScraperEngine** (`src/features/scraper/services/engine.ts`): Generic site scraping via `ScraperRule` configs stored in IndexedDB. Key capabilities:
  - CSS selectors and XPath expressions for DOM parsing
  - `@js:` suffix in queries for custom JavaScript transformation
  - Pagination support for search, TOC, and chapter content
  - Chinese character conversion (简繁转换) via `opencc-js`

### State Management (Jotai)

Atoms defined in `src/state/store.ts`:
- `settingsAtom` — User settings synced with `browser.storage.local` via `createBrowserStorageAtom`
- `readerSessionAtom` — Unified reader session (bookId, title, author, totalChapters, chapterIndex, scrollPosition), synced across contexts
- `currentChapterIndexAtom` — Derived from `readerSessionAtom`, write-through updates session
- `scrollPositionAtom` — Derived from `readerSessionAtom`, write-through updates session
- `activeBookIdAtom` — Read-only derived from `readerSessionAtom`
- `readerVisibleAtom` / `readerLoadingAtom` — Session-only (not persisted), via `createSessionAtom`

## Patterns & Conventions

### 代码规范

- **整洁简洁**：代码必须简洁明了，避免冗余和过度抽象
- **语法糖优先**：使用现代 JS/TS 语法糖（可选链 `?.`、空值合并 `??`、解构赋值、箭头函数等）
- **统一 UI 组件**：全部使用 shadcn/ui 组件库，禁止使用原生 HTML 元素做交互控件
- **组件化复用**：可复用的 UI 片段和业务逻辑必须抽取为组件/hooks，放到 `components/` 或 `hooks/` 目录，禁止复制粘贴重复代码
- **目录扁平**：目录结构保持简洁，最多两层嵌套，不要创建过深的目录层级
- **文件精简**：单个文件控制在 200 行以内，超过时应拆分为子组件或独立模块
- **无需 index.ts**：feature 模块不需要 `index.ts` 导出文件，直接引用具体路径
- **注释语言**：代码注释使用中文，且简洁明了，只在必要时添加（说明"为什么"而非"是什么"）
- **控制台输出**：日志信息简洁，避免冗余输出
- **禁止过度设计**：不为假设性需求预留扩展，三行相似代码优于过早抽象

### File Naming

- **All files**: kebab-case (`bookshelf-page.tsx`, `use-reader-navigation.ts`)
- **React hooks**: `use-` prefix (`use-shortcuts.ts`, `use-reader-navigation.ts`)
- **Page components**: `-page` suffix (`bookshelf-page.tsx`, `about-page.tsx`)

### Import Aliases

- `@/*` → `src/*`

### shadcn/ui

- Components in `src/components/ui/`
- Use `@/components/ui` imports
- Use `cn()` from `@/utils/cn` for conditional class merging
- Installed components: accordion, alert, badge, button, card, checkbox, dialog, dropdown-menu, input, label, scroll-area, select, separator, sheet, sidebar, skeleton, sonner, switch, tabs, textarea, toggle, toggle-group, tooltip

### i18n

- Uses `@wxt-dev/i18n` module configured in `wxt.config.ts`
- Locale files: `src/locales/{zh_CN,en}.json` (simplified JSON format)
- Import: `import { i18n } from "#imports"` (WXT auto-import)
- Usage: `i18n.t("key")` for simple messages, `i18n.t("key", ["$1value"])` for substitutions
- Substitution syntax: `$1` through `$9` (positional), passed as array
- The module auto-generates `_locales/` in the build output for Chrome extension compatibility
- **Never hardcode Chinese/English text in UI components** — always use `i18n.t()`

### Notifications

Use `toast` from `sonner`

### Sidebar

Options page uses `collapsible="offcanvas"` — sidebar hidden when collapsed

### Content Script Events

Reader overlay listens for `show-reader` custom events with `{ bookId, chapterIndex?, scrollPosition? }` detail

### ESLint Rules

- `@typescript-eslint/no-floating-promises` enforced — handle all promises with `void` or `await`
- TanStack Query rules (`@tanstack/query/exhaustive-deps`, `@tanstack/query/stable-query-client`) enforced

### Tests

- Vitest globals enabled (`globals: true`) — `describe`, `it`, `expect` available without imports
- `vitest.setup.ts` mocks `@wxt-dev/i18n` (returns keys as-is) and fixes TextEncoder compatibility with JSDOM
- ESLint test rules enforced: `test/consistent-test-it`, `test/no-identical-title`, `test/prefer-hooks-on-top`
- `demo/` excluded from builds/tests (experimental/demo code)
- `.wxt/` auto-generated by WXT — do not edit

### Feature Module Structure

Each feature in `src/features/<feature>/` follows:
```
<feature>/
├── components/       # Feature-specific UI components
├── hooks/            # Feature-specific React hooks (optional)
├── pages/            # Page components (optional, or page at root)
├── services/         # Business logic, API calls
└── <feature>-page.tsx  # Main page component (at root)
```