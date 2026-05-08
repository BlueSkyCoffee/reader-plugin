import type { Book, Chapter } from "@/types/novel"
import { ParserProvider } from "@/features/lightnovel/services"
import { ScraperEngine } from "@/features/scraper/services"
import { StorageManager } from "@/lib/storage"

/**
 * 获取章节内容服务
 */
export async function fetchChapterContent(book: Book, chapter: Chapter): Promise<string | null> {
  if (book.sourceId) {
    // 使用自定义书源
    const rule = await StorageManager.getRuleById(book.sourceId)
    if (rule) {
      const engine = new ScraperEngine(rule)
      return engine.getChapterContent(chapter.url)
    }
  }
  else if (book.source === "bili" || book.source === "wenku") {
    // 使用内置解析器
    return ParserProvider.fetchChapter(book.source, chapter.url)
  }

  return null
}
