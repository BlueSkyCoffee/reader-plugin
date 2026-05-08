import type { Table } from "dexie"
import type { DownloadTaskRecord } from "@/types/download-task"
import type { Book, Chapter, DownloadRecord, ScraperRule } from "@/types/novel"
import Dexie from "dexie"

export interface MetadataRecord<TValue = unknown> {
  key: string
  value: TValue
}

export class AppDatabase extends Dexie {
  books!: Table<Book, string>
  chapters!: Table<Chapter, number>
  rules!: Table<ScraperRule, string>
  metadata!: Table<MetadataRecord, string>
  downloads!: Table<DownloadRecord, string>
  downloadTasks!: Table<DownloadTaskRecord, string>

  constructor() {
    super("ReaderDB")

    // 版本 2: 新增 downloadTasks 表，优化章节索引
    this.version(2).stores({
      // 书籍表：支持按标题、作者、来源查询
      books: "id, title, author, source, sourceId, addedAt, lastReadAt, [source+sourceId]",

      // 章节表：优化索引设计
      // - [bookId+url]: 唯一标识章节，避免重复
      // - [bookId+order]: 按顺序获取章节
      chapters: "++id, bookId, url, order, contentHash, fetchStatus, [bookId+url], [bookId+order], [bookId+fetchStatus]",

      // 书源规则表
      rules: "id, url, disabled",

      // 元数据表
      metadata: "key",

      // 导出记录表
      downloads: "id, bookId, downloadedAt, format, [bookId+downloadedAt]",

      // 下载任务表（新增）
      downloadTasks: "id, bookId, status, startedAt, [status+startedAt]",
    })

    // 版本 1 到 2 的迁移：为现有章节添加 fetchStatus
    this.version(2).upgrade(async (tx) => {
      const chapters = await tx.table("chapters").toArray()

      for (const chapter of chapters) {
        const updates: Partial<Chapter> = {}

        if (chapter.content) {
          updates.fetchStatus = "fetched"
          // 计算 contentHash（简化版本）
          updates.contentHash = simpleHash(chapter.content)
        }
        else {
          updates.fetchStatus = "pending"
        }

        await tx.table("chapters").update(chapter.id!, updates)
      }
    })
  }
}

export const db = new AppDatabase()

/**
 * 简化的内容哈希函数（用于快速比对）
 */
function simpleHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}
