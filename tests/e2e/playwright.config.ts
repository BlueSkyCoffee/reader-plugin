import process from "node:process"
import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    trace: "on-first-retry",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chrome-extension",
      use: {
        browserName: "chromium",
      },
    },
  ],
  // Note: Browser extension E2E testing with Playwright requires
  // custom setup to load the extension. The extensionPath property
  // is not supported in standard Playwright config.
  // See: https://playwright.dev/docs/chrome-extensions
  // Build extension before running E2E tests
  webServer: {
    command: "pnpm build",
    cwd: "./",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
