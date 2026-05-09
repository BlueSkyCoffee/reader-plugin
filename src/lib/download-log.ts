import { db } from "./db"

export interface DownloadLogEntry {
  timestamp: number
  bookId: string
  bookTitle: string
  level: "info" | "warn" | "error"
  message: string
  details?: string
}

const LOG_PREFIX = "download-log:"
const MAX_LOGS_PER_BOOK = 100
const MAX_LOG_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

/**
 * 下载日志持久化服务
 * 将下载操作日志写入 IndexedDB metadata 表
 */
export class DownloadLog {
  /**
   * 记录下载日志
   */
  static async log(
    bookId: string,
    bookTitle: string,
    level: DownloadLogEntry["level"],
    message: string,
    details?: string,
  ): Promise<void> {
    try {
      const entry: DownloadLogEntry = {
        timestamp: Date.now(),
        bookId,
        bookTitle,
        level,
        message,
        details,
      }

      const key = `${LOG_PREFIX}${bookId}`
      const existing = await db.metadata.get(key)
      const logs: DownloadLogEntry[] = (existing?.value as DownloadLogEntry[]) || []

      logs.push(entry)

      // 限制日志数量
      if (logs.length > MAX_LOGS_PER_BOOK) {
        logs.splice(0, logs.length - MAX_LOGS_PER_BOOK)
      }

      await db.metadata.put({ key, value: logs as any })
    }
    catch {
      // 日志记录失败不应影响主流程
    }
  }

  /**
   * 获取指定书籍的下载日志
   */
  static async getLogs(bookId: string): Promise<DownloadLogEntry[]> {
    try {
      const key = `${LOG_PREFIX}${bookId}`
      const existing = await db.metadata.get(key)
      return (existing?.value as DownloadLogEntry[]) || []
    }
    catch {
      return []
    }
  }

  /**
   * 获取所有下载日志
   */
  static async getAllLogs(): Promise<DownloadLogEntry[]> {
    try {
      const allMetadata = await db.metadata.toArray()
      const allLogs: DownloadLogEntry[] = []

      for (const item of allMetadata) {
        if (item.key.startsWith(LOG_PREFIX) && Array.isArray(item.value)) {
          allLogs.push(...(item.value as DownloadLogEntry[]))
        }
      }

      // 按时间降序排序
      allLogs.sort((a, b) => b.timestamp - a.timestamp)
      return allLogs
    }
    catch {
      return []
    }
  }

  /**
   * 清除指定书籍的下载日志
   */
  static async clearLogs(bookId: string): Promise<void> {
    try {
      const key = `${LOG_PREFIX}${bookId}`
      await db.metadata.delete(key)
    }
    catch {
      // 忽略错误
    }
  }

  /**
   * 清除过期日志
   */
  static async cleanupOldLogs(): Promise<void> {
    try {
      const allMetadata = await db.metadata.toArray()
      const now = Date.now()

      for (const item of allMetadata) {
        if (!item.key.startsWith(LOG_PREFIX) || !Array.isArray(item.value))
          continue

        const logs: DownloadLogEntry[] = item.value as DownloadLogEntry[]
        const validLogs = logs.filter(
          log => now - log.timestamp < MAX_LOG_AGE_MS,
        )

        if (validLogs.length !== logs.length) {
          if (validLogs.length === 0) {
            await db.metadata.delete(item.key)
          }
          else {
            await db.metadata.put({ key: item.key, value: validLogs as any })
          }
        }
      }
    }
    catch {
      // 忽略错误
    }
  }
}
