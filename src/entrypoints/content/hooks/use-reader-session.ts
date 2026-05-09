import { useAtom, useAtomValue } from "jotai"
import { useCallback, useEffect } from "react"
import { db } from "@/lib/db"
import { readerSessionAtom, readerVisibleAtom, settingsAtom } from "@/state/store"
import { log } from "@/utils/logger"

/**
 * 管理阅读会话状态
 * - 监听 show-reader 事件
 * - 同步 session 到 atoms
 * - 自动保存阅读进度
 */
export function useReaderSession() {
  const [session, setSession] = useAtom(readerSessionAtom)
  const [, setVisible] = useAtom(readerVisibleAtom)
  const settings = useAtomValue(settingsAtom)

  // 从 IndexedDB 补充书籍信息
  const hydrateBookInfo = useCallback(async (bookId: string) => {
    const book = await db.books.get(bookId)
    if (!book) {
      return
    }

    const chapters = await db.chapters.where("bookId").equals(bookId).count()

    setSession(prev => ({
      ...prev,
      title: book.title,
      author: book.author || "",
      totalChapters: chapters,
    }))
  }, [setSession])

  // 保存进度到 IndexedDB
  const saveProgressToIndexedDB = useCallback(async () => {
    if (!session.bookId) {
      return
    }

    try {
      await db.books.update(session.bookId, {
        progress: {
          chapterIndex: session.chapterIndex,
          scroll: session.scrollPosition,
        },
        lastReadAt: Date.now(),
      })
    }
    catch (error) {
      log.content.error("Save progress failed", error)
    }
  }, [session.bookId, session.chapterIndex, session.scrollPosition])

  // 监听 show-reader 自定义事件
  useEffect(() => {
    const handleShowReader = (event: Event) => {
      const customEvent = event as CustomEvent<{
        bookId: string
        chapterIndex?: number
        scroll?: number
        scrollPosition?: number
      }>

      const detail = customEvent.detail
      log.content.info("show-reader event received", detail)

      // 先设置基本会话信息
      setSession({
        bookId: detail.bookId,
        title: "",
        author: "",
        totalChapters: 0,
        chapterIndex: detail.chapterIndex ?? 0,
        scrollPosition: detail.scrollPosition ?? detail.scroll ?? 0,
      })

      setVisible(true)

      // 从 IndexedDB 补充完整信息
      void hydrateBookInfo(detail.bookId)
    }

    window.addEventListener("show-reader", handleShowReader)
    return () => window.removeEventListener("show-reader", handleShowReader)
  }, [setSession, setVisible, hydrateBookInfo])

  // 自动保存阅读进度到 IndexedDB 的 Book.progress
  useEffect(() => {
    if (!session.bookId) {
      return
    }

    const saveInterval = setInterval(() => {
      void saveProgressToIndexedDB()
    }, 10000) // 每 10 秒保存一次

    return () => clearInterval(saveInterval)
  }, [session.bookId, saveProgressToIndexedDB])

  // 自动显示阅读器（页面加载时，如果设置开启且存在活跃会话）
  useEffect(() => {
    if (settings.autoShowReader && session.bookId) {
      setVisible(true)
    }
  }, [session.bookId])

  return { session }
}
