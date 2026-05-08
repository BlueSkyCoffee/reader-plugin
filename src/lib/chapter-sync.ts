import type { Chapter } from "@/types/novel"
import { db } from "@/lib/db"

/**
 * 章节同步服务
 * 使用 contentHash 检测内容变化
 */
export class ChapterSyncService {
  /**
   * 批量更新章节（增量）
   * 只更新内容有变化的章节
   */
  static async updateChaptersIncremental(
    bookId: string,
    newChapters: Array<{ title: string, url: string, order: number }>,
  ): Promise<{ added: number, updated: number, unchanged: number }> {
    const existing = await db.chapters.where("bookId").equals(bookId).toArray()
    const existingByUrl = new Map(existing.map(c => [c.url, c]))

    let added = 0
    let updated = 0
    let unchanged = 0

    for (const newChapter of newChapters) {
      const existingChapter = existingByUrl.get(newChapter.url)

      if (!existingChapter) {
        // 新章节
        await db.chapters.add({
          bookId,
          title: newChapter.title,
          url: newChapter.url,
          order: newChapter.order,
          fetchStatus: "pending",
        } as Chapter)
        added++
      }
      else {
        // 已存在，检查是否需要更新
        if (existingChapter.order !== newChapter.order) {
          await db.chapters.update(existingChapter.id!, {
            order: newChapter.order,
          })
          updated++
        }
        else {
          unchanged++
        }
      }
    }

    return { added, updated, unchanged }
  }

  /**
   * 检测内容是否变化（基于哈希）
   */
  static async hasContentChanged(
    chapterId: number,
    newContent: string,
  ): Promise<boolean> {
    const chapter = await db.chapters.get(chapterId)
    if (!chapter || !chapter.contentHash) {
      return true // 无历史哈希，视为变化
    }

    const newHash = simpleHash(newContent)
    return newHash !== chapter.contentHash
  }

  /**
   * 获取书籍的未下载章节
   */
  static async getPendingChapters(bookId: string): Promise<Chapter[]> {
    return db.chapters
      .where("[bookId+fetchStatus]")
      .equals([bookId, "pending"])
      .toArray()
  }

  /**
   * 获取书籍的已下载章节（按顺序）
   */
  static async getFetchedChapters(bookId: string): Promise<Chapter[]> {
    return db.chapters
      .where("[bookId+fetchStatus]")
      .equals([bookId, "fetched"])
      .sortBy("order")
  }
}

/**
 * 简化的内容哈希函数
 */
function simpleHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}
