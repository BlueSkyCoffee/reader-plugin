# E2E Testing Guide

This directory contains end-to-end tests for the Reader browser extension.

## Prerequisites

1. **Build the extension first:**
   ```bash
   pnpm build
   ```

2. **Install Playwright browsers:**
   ```bash
   ppx playwright install chromium
   ```

## Running E2E Tests

### Local Testing

```bash
# Run all E2E tests
pnpm exec playwright test --config=tests/e2e/playwright.config.ts

# Run specific test file
pnpm exec playwright test --config=tests/e2e/playwright.config.ts extension-flow.test.ts

# Run with UI mode (interactive debugging)
pnpm exec playwright test --config=tests/e2e/playwright.config.ts --ui
```

### CI Testing

Set environment variable `E2E_EXTENSION_ENABLED=true` to run E2E tests in CI:

```bash
E2E_EXTENSION_ENABLED=true pnpm exec playwright test --config=tests/e2e/playwright.config.ts
```

## Test Coverage

| Feature | Test |
|---------|------|
| Extension Installation | Load, Popup |
| Search Flow | Results, Empty, No Results |
| Bookshelf | Add, Delete, Sort |
| Rules | View, Toggle, Import, Expand |
| Export | EPUB, Empty Book |
| Light Novel | Parse, Download |
| Settings | Theme, Concurrency |
| Reader | Embed, Navigation |

## Notes

Browser extension E2E testing requires special setup:

1. **Extension Loading** - Playwright must load the built extension from `.output/chrome-mv3`
2. **Background Script** - Service worker must be active for messaging
3. **Content Script** - Must be injected into test pages

Current tests are placeholder tests. Full implementation requires:
- Custom Playwright fixture to load extension
- Mock network responses for scraper tests
- Test fixtures for novel pages

## Debugging

1. **Trace Viewer:**
   ```bash
   pnpm exec playwright show-trace trace.zip
   ```

2. **HTML Report:**
   ```bash
   pnpm exec playwright show-report
   ```

3. **Video recordings** are saved for failed tests in `test-results/`