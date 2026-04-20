/**
 * @vitest-environment jsdom
 */
import type { ScraperRule } from "@/types/novel"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock IndexedDB
vi.mock("@/shared/db/app-db", () => ({
  db: {
    books: {
      toArray: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
    chapters: {
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          delete: vi.fn(),
          sortBy: vi.fn(),
        })),
      })),
      get: vi.fn(),
      add: vi.fn(),
      put: vi.fn(),
    },
    rules: {
      toArray: vi.fn(),
      clear: vi.fn(),
      bulkAdd: vi.fn(),
    },
    metadata: {
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
    },
    downloads: {
      toArray: vi.fn(),
      add: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          delete: vi.fn(),
        })),
      })),
    },
    transaction: vi.fn((_, __, callback) => callback()),
  },
}))

// Mock browser storage
vi.mock("wxt/browser", () => ({
  browser: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
    },
    i18n: {
      getUILanguage: vi.fn(() => "zh-CN"),
    },
  },
}))

// Mock default rules import
vi.mock("@/features/scraper/services/default-rules", () => ({
  DEFAULT_RULES: [
    {
      id: "default_bili",
      name: "哔哩轻小说",
      url: "https://www.bilinovel.com",
      book: { bookName: ".title", author: ".author", intro: ".intro" },
      toc: { item: ".chapter-item" },
      chapter: { content: ".content" },
    },
  ],
  isDefaultRule: vi.fn((id: string) => id.startsWith("default_")),
}))

describe("rules Lifecycle Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("rule management flow", () => {
    it("saves and retrieves rules correctly", async () => {
      const { StorageManager } = await import("@/shared/infra/storage")
      const { db } = await import("@/shared/db/app-db")

      const testRules: ScraperRule[] = [
        {
          id: "rule-1",
          name: "Test Rule 1",
          url: "https://example1.com",
          disabled: false,
          book: { bookName: ".title", author: ".author", intro: ".intro" },
          toc: { item: ".chapter" },
          chapter: { content: ".content" },
        },
        {
          id: "rule-2",
          name: "Test Rule 2",
          url: "https://example2.com",
          disabled: true,
          book: { bookName: ".title", author: ".author", intro: ".intro" },
          toc: { item: ".chapter" },
          chapter: { content: ".content" },
        },
      ]

      // Mock empty rules initially
      vi.mocked(db.rules.toArray).mockResolvedValue([])

      // Save rules
      await StorageManager.saveRules(testRules)

      // Mock saved rules for retrieval
      vi.mocked(db.rules.toArray).mockResolvedValue(testRules)

      // Retrieve rules
      const retrievedRules = await StorageManager.getRules()

      expect(retrievedRules.length).toBe(2)
      expect(retrievedRules[0].name).toBe("Test Rule 1")
      expect(retrievedRules[1].disabled).toBe(true)
    })

    it("toggles rule enabled/disabled state", async () => {
      const { StorageManager } = await import("@/shared/infra/storage")
      const { db } = await import("@/shared/db/app-db")

      const initialRules: ScraperRule[] = [
        {
          id: "rule-toggle-test",
          name: "Toggle Test Rule",
          url: "https://example.com",
          disabled: false,
          book: { bookName: ".title", author: ".author", intro: ".intro" },
          toc: { item: ".chapter" },
          chapter: { content: ".content" },
        },
      ]

      vi.mocked(db.rules.toArray).mockResolvedValue(initialRules)

      // Toggle to disabled
      const disabledRules = initialRules.map(r =>
        r.id === "rule-toggle-test" ? { ...r, disabled: true } : r,
      )
      await StorageManager.saveRules(disabledRules)

      vi.mocked(db.rules.toArray).mockResolvedValue(disabledRules)
      const afterDisable = await StorageManager.getRules()
      expect(afterDisable[0].disabled).toBe(true)

      // Toggle back to enabled
      const enabledRules = disabledRules.map(r =>
        r.id === "rule-toggle-test" ? { ...r, disabled: false } : r,
      )
      await StorageManager.saveRules(enabledRules)

      vi.mocked(db.rules.toArray).mockResolvedValue(enabledRules)
      const afterEnable = await StorageManager.getRules()
      expect(afterEnable[0].disabled).toBe(false)
    })

    it("finds rule by ID", async () => {
      const { StorageManager } = await import("@/shared/infra/storage")
      const { db } = await import("@/shared/db/app-db")

      const rules: ScraperRule[] = [
        {
          id: "find-test-rule",
          name: "Find Test Rule",
          url: "https://example.com",
          book: { bookName: ".title", author: ".author", intro: ".intro" },
          toc: { item: ".chapter" },
          chapter: { content: ".content" },
        },
        {
          id: "other-rule",
          name: "Other Rule",
          url: "https://other.com",
          book: { bookName: ".title", author: ".author", intro: ".intro" },
          toc: { item: ".chapter" },
          chapter: { content: ".content" },
        },
      ]

      vi.mocked(db.rules.toArray).mockResolvedValue(rules)

      const foundRule = await StorageManager.getRuleById("find-test-rule")
      expect(foundRule?.name).toBe("Find Test Rule")

      const notFound = await StorageManager.getRuleById("non-existent")
      expect(notFound).toBeNull()
    })
  })
})
