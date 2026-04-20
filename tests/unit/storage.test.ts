import type { Book, Chapter, ScraperRule } from "@/types/novel"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the IndexedDBManager
vi.mock("@/shared/infra/idb", () => ({
  IndexedDBManager: {
    getBooks: vi.fn(),
    getBook: vi.fn(),
    getChapters: vi.fn(),
    saveBook: vi.fn(),
    saveChapters: vi.fn(),
    deleteBook: vi.fn(),
    getRules: vi.fn(),
    saveRules: vi.fn(),
    getMetadata: vi.fn(),
    setMetadata: vi.fn(),
    getDownloadRecords: vi.fn(),
    getDownloadStats: vi.fn(),
    addDownloadRecord: vi.fn(),
    deleteDownloadRecord: vi.fn(),
    clearDownloadRecords: vi.fn(),
    clearAll: vi.fn(),
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

describe("storageManager", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("formatBytes helper", () => {
    it("formats bytes correctly", async () => {
      const mockBooks: Book[] = [
        {
          id: "book-1",
          title: "Test Book",
          author: "Test Author",
          source: "custom",
          addedAt: Date.now(),
          totalChapters: 10,
        },
        {
          id: "book-2",
          title: "Test Book 2",
          author: "Test Author",
          source: "custom",
          addedAt: Date.now(),
          totalChapters: 20,
        },
      ]

      const { IndexedDBManager } = await import("@/shared/infra/idb")
      vi.mocked(IndexedDBManager.getBooks).mockResolvedValue(mockBooks)

      const { StorageManager } = await import("@/shared/infra/storage")
      const info = await StorageManager.getStorageInfo()

      // Should return storage info object with expected fields
      expect(info).toHaveProperty("totalBooks")
      expect(info).toHaveProperty("totalChapters")
      expect(info).toHaveProperty("estimatedSize")
      expect(info.totalBooks).toBe(2)
      expect(info.totalChapters).toBe(30)
    })
  })

  describe("getBookshelf", () => {
    it("returns books from IndexedDB", async () => {
      const mockBooks: Book[] = [
        {
          id: "book-1",
          title: "Test Book",
          author: "Test Author",
          source: "custom",
          addedAt: Date.now(),
          totalChapters: 0,
        },
      ]

      const { IndexedDBManager } = await import("@/shared/infra/idb")
      vi.mocked(IndexedDBManager.getBooks).mockResolvedValue(mockBooks)

      const { StorageManager } = await import("@/shared/infra/storage")
      const books = await StorageManager.getBookshelf()

      expect(books).toEqual(mockBooks)
      expect(IndexedDBManager.getBooks).toHaveBeenCalledOnce()
    })
  })

  describe("getRules", () => {
    it("returns rules from IndexedDB", async () => {
      const mockRules: ScraperRule[] = [
        {
          id: "rule-1",
          name: "Test Rule",
          url: "https://example.com",
          book: {
            bookName: ".title",
            author: ".author",
            intro: ".intro",
          },
          toc: { item: ".chapter" },
          chapter: { content: ".content" },
        },
      ]

      const { IndexedDBManager } = await import("@/shared/infra/idb")
      vi.mocked(IndexedDBManager.getRules).mockResolvedValue(mockRules)

      const { StorageManager } = await import("@/shared/infra/storage")
      const rules = await StorageManager.getRules()

      expect(rules).toEqual(mockRules)
      expect(IndexedDBManager.getRules).toHaveBeenCalledOnce()
    })
  })

  describe("saveRules", () => {
    it("saves rules to IndexedDB", async () => {
      const mockRules: ScraperRule[] = [
        {
          id: "rule-1",
          name: "Test Rule",
          url: "https://example.com",
          book: {
            bookName: ".title",
            author: ".author",
            intro: ".intro",
          },
          toc: { item: ".chapter" },
          chapter: { content: ".content" },
        },
      ]

      const { IndexedDBManager } = await import("@/shared/infra/idb")
      vi.mocked(IndexedDBManager.saveRules).mockResolvedValue(undefined)

      const { StorageManager } = await import("@/shared/infra/storage")
      await StorageManager.saveRules(mockRules)

      expect(IndexedDBManager.saveRules).toHaveBeenCalledWith(mockRules)
    })
  })

  describe("saveBook", () => {
    it("saves book without chapters", async () => {
      const mockBook: Book = {
        id: "book-1",
        title: "Test Book",
        author: "Test Author",
        source: "custom",
        addedAt: Date.now(),
        totalChapters: 0,
      }

      const { IndexedDBManager } = await import("@/shared/infra/idb")
      vi.mocked(IndexedDBManager.saveBook).mockResolvedValue(undefined)

      const { StorageManager } = await import("@/shared/infra/storage")
      await StorageManager.saveBook(mockBook)

      expect(IndexedDBManager.saveBook).toHaveBeenCalledWith(mockBook)
      expect(IndexedDBManager.saveChapters).not.toHaveBeenCalled()
    })

    it("saves book with chapters", async () => {
      const mockBook: Book = {
        id: "book-1",
        title: "Test Book",
        author: "Test Author",
        source: "custom",
        addedAt: Date.now(),
        totalChapters: 2,
      }

      const mockChapters: Chapter[] = [
        { bookId: "book-1", title: "Chapter 1", url: "https://example.com/ch1", order: 1 },
        { bookId: "book-1", title: "Chapter 2", url: "https://example.com/ch2", order: 2 },
      ]

      const { IndexedDBManager } = await import("@/shared/infra/idb")
      vi.mocked(IndexedDBManager.saveBook).mockResolvedValue(undefined)
      vi.mocked(IndexedDBManager.saveChapters).mockResolvedValue(undefined)

      const { StorageManager } = await import("@/shared/infra/storage")
      await StorageManager.saveBook(mockBook, mockChapters)

      expect(IndexedDBManager.saveBook).toHaveBeenCalledWith(mockBook)
      expect(IndexedDBManager.saveChapters).toHaveBeenCalledWith("book-1", mockChapters)
    })
  })

  describe("deleteBook", () => {
    it("deletes book from IndexedDB", async () => {
      const { IndexedDBManager } = await import("@/shared/infra/idb")
      vi.mocked(IndexedDBManager.deleteBook).mockResolvedValue(undefined)

      const { StorageManager } = await import("@/shared/infra/storage")
      await StorageManager.deleteBook("book-1")

      expect(IndexedDBManager.deleteBook).toHaveBeenCalledWith("book-1")
    })
  })

  describe("clearAll", () => {
    it("clears all storage", async () => {
      const { IndexedDBManager } = await import("@/shared/infra/idb")
      vi.mocked(IndexedDBManager.clearAll).mockResolvedValue(undefined)

      const { browser } = await import("wxt/browser")
      vi.mocked(browser.storage.local.remove).mockResolvedValue(undefined)

      const { StorageManager } = await import("@/shared/infra/storage")
      await StorageManager.clearAll()

      expect(IndexedDBManager.clearAll).toHaveBeenCalledOnce()
      expect(browser.storage.local.remove).toHaveBeenCalledOnce()
    })
  })
})
