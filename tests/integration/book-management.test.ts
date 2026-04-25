/**
 * @vitest-environment jsdom
 */
import type { Book, Chapter } from "@/types/novel"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the IndexedDBManager directly
const mockGetBooks = vi.fn()
const mockGetBook = vi.fn()
const mockSaveBook = vi.fn()
const mockDeleteBook = vi.fn()
const mockGetChapters = vi.fn()
const mockSaveChapters = vi.fn()
const mockGetMetadata = vi.fn()
const mockSetMetadata = vi.fn()
const mockGetRules = vi.fn()
const mockSaveRules = vi.fn()

vi.mock("@/lib/idb", () => ({
  IndexedDBManager: {
    getBooks: mockGetBooks,
    getBook: mockGetBook,
    saveBook: mockSaveBook,
    deleteBook: mockDeleteBook,
    getChapters: mockGetChapters,
    saveChapters: mockSaveChapters,
    getMetadata: mockGetMetadata,
    setMetadata: mockSetMetadata,
    getRules: mockGetRules,
    saveRules: mockSaveRules,
  },
}))

// Mock browser storage
vi.mock("wxt/browser", () => ({
  browser: {
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn().mockResolvedValue(undefined),
      },
    },
    i18n: {
      getUILanguage: vi.fn(() => "zh-CN"),
    },
  },
}))

describe("book Management Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("bookshelf operations", () => {
    it("adds book to bookshelf and retrieves it", async () => {
      const { StorageManager } = await import("@/lib/storage")

      const newBook: Book = {
        id: "book-integration-1",
        title: "Integration Test Book",
        author: "Test Author",
        source: "custom",
        addedAt: Date.now(),
        totalChapters: 100,
      }

      // Save book
      mockSaveBook.mockResolvedValue(undefined)
      await StorageManager.saveBook(newBook)

      // Mock bookshelf with the new book
      mockGetBooks.mockResolvedValue([newBook])
      mockGetBook.mockResolvedValue(newBook)

      // Retrieve bookshelf
      const bookshelf = await StorageManager.getBookshelf()
      expect(bookshelf.length).toBe(1)
      expect(bookshelf[0].title).toBe("Integration Test Book")

      // Retrieve specific book
      const retrievedBook = await StorageManager.getBook("book-integration-1")
      expect(retrievedBook?.title).toBe("Integration Test Book")

      expect(mockSaveBook).toHaveBeenCalledWith(newBook)
    })

    it("adds book with chapters", async () => {
      const { StorageManager } = await import("@/lib/storage")

      const book: Book = {
        id: "book-with-chapters",
        title: "Book With Chapters",
        author: "Test Author",
        source: "custom",
        addedAt: Date.now(),
        totalChapters: 3,
      }

      const chapters: Chapter[] = [
        { bookId: "book-with-chapters", title: "Chapter 1", url: "https://example.com/ch1", order: 1 },
        { bookId: "book-with-chapters", title: "Chapter 2", url: "https://example.com/ch2", order: 2 },
        { bookId: "book-with-chapters", title: "Chapter 3", url: "https://example.com/ch3", order: 3 },
      ]

      mockSaveBook.mockResolvedValue(undefined)
      mockSaveChapters.mockResolvedValue(undefined)

      // Save book with chapters
      await StorageManager.saveBook(book, chapters)

      expect(mockSaveBook).toHaveBeenCalledWith(book)
      expect(mockSaveChapters).toHaveBeenCalledWith("book-with-chapters", chapters)
    })

    it("retrieves chapters for a book", async () => {
      const { StorageManager } = await import("@/lib/storage")

      const chapters: Chapter[] = [
        { bookId: "book-chapters-test", title: "Chapter 1", url: "https://example.com/ch1", order: 1 },
        { bookId: "book-chapters-test", title: "Chapter 2", url: "https://example.com/ch2", order: 2 },
      ]

      mockGetChapters.mockResolvedValue(chapters)

      const retrievedChapters = await StorageManager.getBookChapters("book-chapters-test")

      expect(retrievedChapters.length).toBe(2)
      expect(retrievedChapters[0].title).toBe("Chapter 1")
      expect(mockGetChapters).toHaveBeenCalledWith("book-chapters-test")
    })

    it("deletes book", async () => {
      const { StorageManager } = await import("@/lib/storage")

      mockDeleteBook.mockResolvedValue(undefined)

      await StorageManager.deleteBook("book-to-delete")

      expect(mockDeleteBook).toHaveBeenCalledWith("book-to-delete")
    })

    it("switches active book and sets session", async () => {
      const { StorageManager } = await import("@/lib/storage")
      const { browser } = await import("wxt/browser")

      const book: Book = {
        id: "book-progress-test",
        title: "Progress Test Book",
        author: "Test Author",
        source: "custom",
        addedAt: Date.now(),
        totalChapters: 50,
        progress: {
          chapterIndex: 10,
          scroll: 500,
        },
      }

      mockGetBook.mockResolvedValue(book)
      mockSetMetadata.mockResolvedValue(undefined)
      vi.mocked(browser.storage.local.set).mockResolvedValue(undefined)

      // Switch to book (sets active session)
      await StorageManager.switchBook("book-progress-test")

      expect(mockGetBook).toHaveBeenCalledWith("book-progress-test")
      expect(mockSetMetadata).toHaveBeenCalled()
      expect(browser.storage.local.set).toHaveBeenCalled()
    })
  })

  describe("bookshelf sorting", () => {
    it("sorts books by addedAt descending", async () => {
      const { StorageManager } = await import("@/lib/storage")

      const books: Book[] = [
        {
          id: "book-old",
          title: "Old Book",
          author: "Author",
          source: "custom",
          addedAt: 1000,
          totalChapters: 10,
        },
        {
          id: "book-new",
          title: "New Book",
          author: "Author",
          source: "custom",
          addedAt: 2000,
          totalChapters: 20,
        },
        {
          id: "book-middle",
          title: "Middle Book",
          author: "Author",
          source: "custom",
          addedAt: 1500,
          totalChapters: 15,
        },
      ]

      // IndexedDBManager already sorts by addedAt descending
      mockGetBooks.mockResolvedValue([
        books[1], // book-new (addedAt: 2000)
        books[2], // book-middle (addedAt: 1500)
        books[0], // book-old (addedAt: 1000)
      ])

      const bookshelf = await StorageManager.getBookshelf()

      // Should be sorted by addedAt descending
      expect(bookshelf[0].id).toBe("book-new")
      expect(bookshelf[1].id).toBe("book-middle")
      expect(bookshelf[2].id).toBe("book-old")
    })
  })
})
