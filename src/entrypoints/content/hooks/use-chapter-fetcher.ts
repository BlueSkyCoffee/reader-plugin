import type { Chapter } from "@/types/novel"
import { useAtom, useAtomValue } from "jotai"
import { useEffect, useState } from "react"
import { db } from "@/lib/db"
import { currentChapterIndexAtom, readerSessionAtom } from "@/state/store"
import { log } from "@/utils/logger"
import { fetchChapterContent } from "../services/content-fetcher"

/**
 * 章节内容获取 hook
 * - 自动获取当前章节内容
 * - 缓存到 IndexedDB
 */
export function useChapterFetcher() {
  const session = useAtomValue(readerSessionAtom)
  const [currentIndex] = useAtom(currentChapterIndexAtom)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [isFetching, setIsFetching] = useState(false)

  // 加载书籍的所有章节
  useEffect(() => {
    if (!session?.bookId) {
      setChapters([])
      return
    }

    void db.chapters
      .where("bookId")
      .equals(session.bookId)
      .sortBy("order")
      .then(setChapters)
  }, [session?.bookId])

  // 获取当前章节内容（如果未缓存）
  useEffect(() => {
    const currentChapter = chapters[currentIndex]
    if (!currentChapter || currentChapter.content || isFetching) {
      return
    }

    if (!session?.bookId)
      return

    const fetchContent = async () => {
      setIsFetching(true)

      try {
        const book = await db.books.get(session.bookId!)
        if (!book)
          return

        const content = await fetchChapterContent(book, currentChapter)

        if (content) {
          await db.chapters.update(currentChapter.id!, {
            content,
            fetchStatus: "fetched",
            contentHash: simpleHash(content),
          })

          setChapters((prev) => {
            const next = [...prev]
            next[currentIndex] = { ...currentChapter, content, fetchStatus: "fetched" }
            return next
          })
        }
      }
      catch (error) {
        log.content.error("Fetch chapter content failed", error)

        // 标记失败
        await db.chapters.update(currentChapter.id!, {
          fetchStatus: "failed",
          fetchError: String(error),
        })
      }
      finally {
        setIsFetching(false)
      }
    }

    void fetchContent()
  }, [session, chapters, currentIndex, isFetching])

  return {
    chapters,
    currentChapter: chapters[currentIndex],
    isFetching,
    currentIndex,
  }
}

function simpleHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}
