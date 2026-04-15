# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Novel Frog** — A Chrome/Edge browser extension built with [Wxt](https://wxt.dev/) for web novel discovery, downloading, EPUB generation, and reading. Supports Chinese web novel sites (bilinovel.com, wenku8.net) with a custom scraper engine for additional sites.

## Tech Stack

- **Framework**: Wxt (browser extension framework on top of Vite)
- **UI**: React 19 + React Router 7
- **Styling**: Tailwind CSS v4 + shadcn/ui + Radix UI + base-ui
- **State**: Jotai (atom-based state management)
- **Database**: Dexie (IndexedDB wrapper) — DB name: `NovelFrogDB`
- **Validation**: Zod + Valibot
- **i18n**: Wxt i18n module + custom fallback (`src/shared/i18n/`)
- **Linting**: ESLint 9 with @antfu/eslint-config
- **Testing**: Vitest + Testing Library
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
```

## Architecture

### Directory Structure

```
src/
├── entrypoints/          # Wxt extension entrypoints
│   ├── background/       # Service worker (message handlers)
│   ├── content/          # Content script (in-page reader overlay)
│   ├── popup/            # Extension popup (quick access)
│   └── options/          # Options page (full app with routing)
├── features/             # Feature modules (vertical slices)
│   ├── bookshelf/        # Library management
│   ├── download/         # Download management & EPUB generation
│   ├── lightnovel/       # Light novel parsing (bili/wenku providers)
│   ├── reader/           # In-page reader UI (overlay, controls)
│   ├── rules/            # Scraper rule management
│   ├── scraper/          # Generic scraping engine
│   ├── search/           # Novel search functionality
│   └── settings/         # Settings UI
├── shared/               # Cross-cutting concerns
│   ├── components/       # Reusable UI (shadcn/ui, layout, settings)
│   ├── contracts/        # Message type definitions
│   ├── db/               # Dexie database setup
│   ├── hooks/            # Shared React hooks
│   ├── i18n/             # Internationalization
│   ├── infra/            # Infrastructure (messaging, storage, IDB)
│   └── state/            # Jotai atoms
├── types/                # Shared TypeScript types & Zod schemas
└── utils/                # Utility functions
```

### Extension Entrypoints

1. **Background** (`src/entrypoints/background/`) — Service worker that registers message handlers via `registerHandlers()`. Handles `fetchHtml`, `fetchNovelMetadata`, `fetchNovelCatalog`, and `startDownload` requests from other contexts.

2. **Content Script** (`src/entrypoints/content/`) — Injects a React reader overlay into any page (`<all_urls>`). Renders inside `#novel-frog-root`. Listens for `show-reader` custom events and fetches chapter content via the scraper engine or ParserProvider.

3. **Popup** (`src/entrypoints/popup/`) — Small popup with quick access links and a search bar.

4. **Options** (`src/entrypoints/options/`) — Full options page with sidebar navigation and React Router. Routes defined in `src/entrypoints/options/constants/routes.ts`: bookshelf, search, downloads, lightnovel, rules, settings (general/help/about), reader.

### Cross-Context Messaging

Uses `@webext-core/messaging` for typed RPC between contexts. Message contracts defined in `src/shared/contracts/messages.ts` (`ExtensionProtocolMap`):

- `requestMessage(key, data)` — Send request from any context to background
- `registerHandlers(handlers)` — Register handlers in background (see `src/shared/infra/messaging.ts`)

### Data Layer

- **IndexedDB** (`src/shared/db/app-db.ts`): Dexie-based DB `NovelFrogDB` with tables: `books`, `chapters`, `rules`, `metadata`, `downloads`
- **Browser Storage** (`src/shared/infra/storage.ts`): `SettingsManager` for app settings via `browser.storage.local`, `IndexedDBManager` for books/chapters/rules/downloads
- **Storage Keys** (`src/shared/constants/storage.ts`): `novel-frog:app-settings`, `novel-frog:active-reader-session`

### State Management

Jotai atoms in `src/shared/state/store.ts`:
- `settingsAtom` — persisted user settings (theme, reader style, font size)
- `activeBookIdAtom`, `currentChapterIndexAtom`, `scrollPositionAtom` — reader session state

### Novel Sources

`ParserProvider` (`src/features/lightnovel/services/parser/provider.ts`) is the central abstraction:
- **bili** — bilinovel.com / linovelib.com
- **wenku** — wenku8.net

The scraper engine (`src/features/scraper/services/engine.ts`) handles generic site scraping via user-defined `ScraperRule` configurations stored in IndexedDB.

### Type Validation

All domain types use Zod schemas in `src/types/novel.ts` and `src/types/config.ts`, inferred via `z.infer`. Key schemas: `bookSchema`, `chapterSchema`, `volumeSchema`, `userSettingsSchema`, `readerStyleSchema`, `scraperRule` (interface).

## Patterns & Conventions

- **Feature module exports**: Each `src/features/*/index.ts` re-exports the public API
- **Path aliases**: `@/*` maps to `src/*`
- **UI components**: shadcn/ui in `src/shared/components/ui/`, settings primitives in `src/shared/components/settings/`
- **i18n**: Use `i18n.t("key")` from `@/shared/i18n` — resolves via `browser.i18n.getMessage` with fallbacks
- The `demo/` directory is excluded from builds and tests
- `.wxt/` is auto-generated — don't edit manually
- `@typescript-eslint/no-floating-promises` is enforced — always handle promises
