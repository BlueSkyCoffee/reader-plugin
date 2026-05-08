import type { UserSettings } from "@/types/config"
import type { Book, Chapter, DownloadRecord, ScraperRule } from "@/types/novel"
import { i18n } from "#imports"
import { browser } from "wxt/browser"
import { STORAGE_KEYS } from "@/constants/storage"
import { DEFAULT_USER_SETTINGS, userSettingsSchema } from "@/types/config"
import { log } from "@/utils/logger"
import { IndexedDBManager } from "./idb"

export interface ActiveReaderSession {
  bookId: string
  title: string
  author: string
  totalChapters: number
  chapterIndex: number
  scroll: number
}

const SettingsManager = {
  async getSettings(): Promise<UserSettings> {
    const result = await browser.storage.local.get(STORAGE_KEYS.appSettings)
    const settings = result[STORAGE_KEYS.appSettings]
    const parsedSettings = userSettingsSchema.safeParse(settings)

    return parsedSettings.success ? parsedSettings.data : DEFAULT_USER_SETTINGS
  },

  async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const currentSettings = await this.getSettings()
    const nextSettings = userSettingsSchema.parse({ ...currentSettings, ...settings })

    await browser.storage.local.set({
      [STORAGE_KEYS.appSettings]: nextSettings,
    })

    return nextSettings
  },
}

export const StorageManager = {
  getBookshelf: () => IndexedDBManager.getBooks(),
  getBook: (bookId: string) => IndexedDBManager.getBook(bookId),
  getBookChapters: (bookId: string) => IndexedDBManager.getChapters(bookId),
  async saveBook(book: Book, chapters: Chapter[] = []) {
    await IndexedDBManager.saveBook(book)

    if (chapters.length > 0) {
      await IndexedDBManager.saveChapters(book.id, chapters)
    }
  },
  deleteBook: (bookId: string) => IndexedDBManager.deleteBook(bookId),

  async switchBook(bookId: string) {
    const book = await IndexedDBManager.getBook(bookId)
    if (!book) {
      throw new Error(`Book not found in DB: ${bookId}`)
    }

    const activeReaderSession = {
      bookId,
      title: book.title,
      author: book.author || "",
      totalChapters: book.totalChapters || 0,
      chapterIndex: book.progress?.chapterIndex || 0,
      scroll: book.progress?.scroll || 0,
    }

    await IndexedDBManager.setMetadata("activeBook", activeReaderSession)
    await this.setActiveReaderSession(activeReaderSession)
  },

  async getActiveReaderSession(): Promise<ActiveReaderSession | undefined> {
    const stored = await browser.storage.local.get(STORAGE_KEYS.activeReaderSession)
    return stored[STORAGE_KEYS.activeReaderSession] as ActiveReaderSession | undefined
  },

  async setActiveReaderSession(session: {
    bookId: string
    title: string
    author: string
    totalChapters: number
    chapterIndex: number
    scroll: number
  }) {
    await browser.storage.local.set({
      [STORAGE_KEYS.activeReaderSession]: session,
    })
  },

  async getActiveBookId(): Promise<string | null> {
    const metadata = await IndexedDBManager.getMetadata<{ bookId: string }>("activeBook")
    return metadata?.bookId || null
  },

  getSettings: () => SettingsManager.getSettings(),
  saveSettings: (settings: Partial<UserSettings>) => SettingsManager.saveSettings(settings),

  getRules: () => IndexedDBManager.getRules(),
  async getRuleById(ruleId: string): Promise<ScraperRule | null> {
    const rules = await IndexedDBManager.getRules()
    return rules.find(rule => rule.id === ruleId) ?? null
  },
  saveRules: (rules: ScraperRule[]) => IndexedDBManager.saveRules(rules),

  getDownloadRecords: () => IndexedDBManager.getDownloadRecords(),
  getDownloadStats: () => IndexedDBManager.getDownloadStats(),
  addDownloadRecord: (record: DownloadRecord) => IndexedDBManager.addDownloadRecord(record),
  deleteDownloadRecord: (recordId: string) => IndexedDBManager.deleteDownloadRecord(recordId),
  clearDownloadRecords: () => IndexedDBManager.clearDownloadRecords(),

  async clearAll() {
    await IndexedDBManager.clearAll()
    await browser.storage.local.remove([
      STORAGE_KEYS.activeReaderSession,
      STORAGE_KEYS.appSettings,
    ])
  },

  async getStorageInfo() {
    const books = await IndexedDBManager.getBooks()
    const totalChapters = books.reduce((sum, book) => sum + (book.totalChapters || 0), 0)
    let estimatedSize = i18n.t("storage_unknown")

    try {
      if (navigator?.storage?.estimate) {
        const estimate = await navigator.storage.estimate()
        if (estimate.usage !== undefined) {
          estimatedSize = formatBytes(estimate.usage)
        }
      }
    }
    catch (error) {
      log.storage.error("Get storage info failed", error)
    }

    return {
      totalBooks: books.length,
      totalChapters,
      estimatedSize,
    }
  },
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) {
    return "0 Bytes"
  }

  const base = 1024
  const fractionDigits = decimals < 0 ? 0 : decimals
  const units = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(base))

  return `${Number.parseFloat((bytes / (base ** unitIndex)).toFixed(fractionDigits))} ${units[unitIndex]}`
}
