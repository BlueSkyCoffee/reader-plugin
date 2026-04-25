import type { Book, Chapter, ScraperRule } from "@/types/novel"
import { BUILTIN_RULES, ScraperEngine } from "@/features/scraper/services"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"
import { withRetry } from "@/utils/retry"

function getErrorMessage(error: unknown): string {
  if (error instanceof Error)
    return error.message
  if (typeof error === "string")
    return error
  return String(error)
}

export type DownloadStatus
  = | "pending"
    | "downloading"
    | "paused"
    | "completed"
    | "error"

export interface DownloadTask {
  bookId: string
  bookName: string
  totalChapters: number
  downloadedChapters: number
  status: DownloadStatus
  error?: string
  startTime: number
  failedChapters: number
  retriedChapters: number
  currentChapter?: string
}

type ProgressCallback = (task: DownloadTask) => void

/**
 * 前台下载管理器
 * 利用 ScraperEngine 的 fetchHtml 中继，批量获取章节并存入 IndexedDB
 */
export class DownloadManager {
  private static instance: DownloadManager
  private tasks: Map<string, DownloadTask> = new Map()
  private activeDownloads: Set<string> = new Set()
  private progressCallbacks: Map<string, Set<ProgressCallback>> = new Map()
  private CONCURRENCY = 3 // 并发请求数限制，避免被源站屏蔽

  private constructor() { }

  static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager()
    }
    return DownloadManager.instance
  }

  /**
   * 开始下载书籍
   */
  async startDownload(book: Book, ruleId?: string) {
    if (this.activeDownloads.has(book.id))
      return

    const rules = await StorageManager.getRules()
    // 优先从自定义规则找，找不到再找内置规则
    const rule
      = rules.find(r => r.id === (ruleId || book.sourceId))
        || BUILTIN_RULES.find(r => r.id === (ruleId || book.sourceId))

    if (!rule) {
      throw new Error("未找到对应的书源规则")
    }

    let chapters = await StorageManager.getBookChapters(book.id)
    if (!chapters || chapters.length === 0) {
      try {
        const settings = await StorageManager.getSettings()
        const engine = new ScraperEngine(rule)
        const { toc } = await engine.getBookInfo(book.bookUrl!, settings.language)
        chapters = toc.map((t, i) => ({
          bookId: book.id,
          title: t.title,
          content: "",
          url: t.url,
          order: i + 1,
        }))
        await StorageManager.saveBook(book, chapters)
      }
      catch {
        throw new Error("获取目录失败")
      }
    }

    const downloadedCount = chapters.filter(
      c => c.content && c.content.trim().length > 0,
    ).length

    const task: DownloadTask = {
      bookId: book.id,
      bookName: book.title,
      totalChapters: chapters.length,
      downloadedChapters: downloadedCount,
      status: "downloading",
      startTime: Date.now(),
      failedChapters: 0,
      retriedChapters: 0,
    }

    this.tasks.set(book.id, task)
    this.activeDownloads.add(book.id)
    this.notifyProgress(book.id)

    // 异步执行批量下载任务
    void this.processDownload(book, chapters, rule)
  }

  /**
   * 暂停/取消下载
   */
  pauseDownload(bookId: string) {
    if (this.activeDownloads.has(bookId)) {
      this.activeDownloads.delete(bookId)
    }
  }

  /**
   * 监听下载进度
   */
  onProgress(bookId: string, callback: ProgressCallback) {
    if (!this.progressCallbacks.has(bookId)) {
      this.progressCallbacks.set(bookId, new Set())
    }
    this.progressCallbacks.get(bookId)!.add(callback)

    if (this.tasks.has(bookId)) {
      callback(this.tasks.get(bookId)!)
    }

    return () => {
      const callbacks = this.progressCallbacks.get(bookId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.progressCallbacks.delete(bookId)
        }
      }
    }
  }

  private notifyProgress(bookId: string) {
    const task = this.tasks.get(bookId)
    if (!task) {
      return
    }

    const callbacks = this.progressCallbacks.get(bookId)
    callbacks?.forEach((callback) => {
      callback(task)
    })
  }

  private async processDownload(
    book: Book,
    chapters: Chapter[],
    rule: ScraperRule,
  ) {
    const engine = new ScraperEngine(rule)
    const task = this.tasks.get(book.id)!
    const concurrency = this.getConcurrency(rule)

    // 获取用户设置中的语言偏好
    const settings = await StorageManager.getSettings()
    const targetLanguage = settings.language

    const pendingChapters = chapters
      .map((c, index) => ({ c, index }))
      .filter(({ c }) => !c.content || c.content.trim().length === 0)

    if (pendingChapters.length === 0) {
      task.status = "completed"
      this.activeDownloads.delete(book.id)
      this.notifyProgress(book.id)
      return
    }

    try {
      for (let i = 0; i < pendingChapters.length; i += concurrency) {
        if (!this.activeDownloads.has(book.id)) {
          task.status = "paused"
          this.notifyProgress(book.id)
          return
        }

        const batch = pendingChapters.slice(i, i + concurrency)

        await Promise.all(
          batch.map(async ({ c, index }) => {
            if (c.url) {
              task.currentChapter = c.title
              try {
                await new Promise(r => setTimeout(r, this.getDownloadDelay(rule)))
                const content = await withRetry(
                  () => engine.getChapterContent(c.url, targetLanguage),
                  {
                    maxAttempts: rule.crawl?.maxAttempts ?? 3,
                    minInterval: rule.crawl?.retryMinInterval ?? 1000,
                    maxInterval: rule.crawl?.retryMaxInterval ?? 3000,
                    onRetry: (attempt, error) => {
                      task.retriedChapters++
                      log.download.warn(`Retry ${attempt} for "${c.title}"`, error.message)
                    },
                  },
                )
                chapters[index].content = content
                task.downloadedChapters++
              }
              catch (e: unknown) {
                task.failedChapters++
                log.download.error(`"${c.title}" failed after retries`, getErrorMessage(e))
              }
            }
          }),
        )

        await StorageManager.saveBook(book, chapters)
        this.notifyProgress(book.id)
      }

      task.status = "completed"
    }
    catch (e: unknown) {
      log.download.error("Download process failed", e)
      task.status = "error"
      task.error = getErrorMessage(e)
    }
    finally {
      this.activeDownloads.delete(book.id)
      this.notifyProgress(book.id)
    }
  }

  getTask(bookId: string): DownloadTask | undefined {
    return this.tasks.get(bookId)
  }

  private getConcurrency(rule: ScraperRule) {
    const ruleConcurrency = rule.crawl?.concurrency
    if (ruleConcurrency && ruleConcurrency > 0)
      return Math.min(ruleConcurrency, this.CONCURRENCY)

    return this.CONCURRENCY
  }

  private getDownloadDelay(rule: ScraperRule) {
    const min = rule.crawl?.minInterval ?? 300
    const max = rule.crawl?.maxInterval ?? 800
    if (max <= min)
      return min

    return min + Math.random() * (max - min)
  }
}
