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
- **i18n**: Wxt i18n module + JSON fallback (`src/i18n/`)
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
│   └── <feature>/        # components/, hooks/, pages/, services/, index.ts
├── hooks/                # Shared React hooks
├── i18n/                 # Internationalization helper
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
└── _locales/             # i18n: zh_CN, en (WXT copies to extension root)
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

### Cross-Context Messaging

Uses `@webext-core/messaging`. Message contracts in `src/lib/contracts/messages.ts` (`ExtensionProtocolMap`):
- `requestMessage(key, data)` — Send request to background
- `registerHandlers(handlers)` — Register handlers in background

### Data Layer

- **IndexedDB** (`src/lib/db.ts`): `ReaderDB` with tables: `books`, `chapters`, `rules`, `metadata`, `downloads`
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
- `settingsAtom` — User settings synced with `browser.storage.local`
- `activeBookIdAtom` — Currently active book ID
- `currentChapterIndexAtom` — Current chapter index for reader
- `scrollPositionAtom` — Reader scroll position

## Patterns & Conventions

### File Naming

- **All files**: kebab-case (`bookshelf-page.tsx`, `use-reader-navigation.ts`)
- **React hooks**: `use-` prefix (`use-shortcuts.ts`, `use-reader-navigation.ts`)
- **Page components**: `-page` suffix (`bookshelf-page.tsx`, `about-page.tsx`)
- **Feature exports**: `src/features/*/index.ts` re-exports public API

### Import Aliases

- `@/*` → `src/*`
- `@locales` → `public/_locales`

### shadcn/ui

- Components in `src/components/ui/`
- Use `@/components/ui` imports
- Use `cn()` from `@/utils/cn` for conditional class merging

### i18n

- Source files: `public/_locales/{zh_CN,en}/messages.json`
- WXT copies to extension root `_locales/`
- Usage: `i18n.t("key", { params })` — uses `browser.i18n.getMessage` with JSON fallback for tests/SSR
- Key normalization: dots converted to underscores (`normalizeMessageKey`)
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

- `vitest.setup.ts` mocks `wxt/testing` fakeBrowser and fixes TextEncoder compatibility with JSDOM
- `demo/` excluded from builds/tests
- `.wxt/` auto-generated

### Feature Module Structure

Each feature in `src/features/<feature>/` follows:
```
<feature>/
├── components/       # Feature-specific UI components
├── hooks/            # Feature-specific React hooks (optional)
├── pages/            # Page components (optional, or page at root)
├── services/         # Business logic, API calls
├── index.ts          # Public API re-exports
└── <feature>-page.tsx  # Main page component (at root)
```