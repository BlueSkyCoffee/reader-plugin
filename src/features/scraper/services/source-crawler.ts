import type { BookInfo, Chapter, ScraperRule, SearchResult } from "@/types/novel"
import { ScraperEngine } from "./engine"

export interface CrawlProgress {
  completed: number
  total: number
  lastChapter?: Chapter
}

export interface CrawlOptions {
  concurrency?: number
  onProgress?: (progress: CrawlProgress) => void
}

export class SourceCrawler {
  private engine: ScraperEngine

  constructor(private rule: ScraperRule) {
    this.engine = new ScraperEngine(rule)
  }

  search(keyword: string): Promise<SearchResult[]> {
    return this.engine.search(keyword)
  }

  async fetchBook(bookUrl: string): Promise<{ info: BookInfo, toc: Chapter[] }> {
    return this.engine.getBookInfo(bookUrl)
  }

  fetchChapter(url: string): Promise<string> {
    return this.engine.getChapterContent(url)
  }

  async crawlChapters(chapters: Chapter[], options: CrawlOptions = {}) {
    const total = chapters.length
    const concurrency = Math.max(1, Math.min(options.concurrency ?? this.rule.crawl?.concurrency ?? 3, total || 1))
    const minInterval = this.rule.crawl?.minInterval ?? 300
    const maxInterval = this.rule.crawl?.maxInterval ?? 800
    const delay = () => new Promise(resolve => setTimeout(resolve, minInterval + Math.random() * Math.max(0, maxInterval - minInterval)))

    let completed = 0
    const queue = [...chapters]
    const workers = Array.from({ length: concurrency }, async () => {
      while (queue.length > 0) {
        const chapter = queue.shift()
        if (!chapter) {
          return
        }

        await delay()
        await this.fetchChapter(chapter.url)

        completed += 1
        options.onProgress?.({ completed, total, lastChapter: chapter })
      }
    })

    await Promise.all(workers)
  }
}
