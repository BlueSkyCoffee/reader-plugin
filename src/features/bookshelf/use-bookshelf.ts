import type { Book } from "@/types/novel"
import { useCallback, useEffect, useState } from "react"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"

export function useBookshelf() {
  const [books, setBooks] = useState<Book[]>([])
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadBooks = useCallback(async () => {
    setIsLoading(true)
    try {
      const list = await StorageManager.getBookshelf()
      const activeId = await StorageManager.getActiveBookId()
      setBooks(list)
      setActiveBookId(activeId)
    }
    catch (e) {
      log.bookshelf.error("Load bookshelf failed", e)
    }
    finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadBooks()
  }, [loadBooks])

  const refresh = useCallback(() => {
    void loadBooks()
  }, [loadBooks])

  return { books, activeBookId, isLoading, refresh, setActiveBookId }
}
