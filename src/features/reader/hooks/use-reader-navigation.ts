import { i18n } from "#imports"
import { useCallback } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"

export interface OpenReaderOptions {
  bookId: string
  chapterIndex?: number
  scrollPosition?: number
}

export function useReaderNavigation() {
  const navigate = useNavigate()

  const openReader = useCallback(
    async ({ bookId, chapterIndex = 0, scrollPosition = 0 }: OpenReaderOptions) => {
      try {
        const book = await StorageManager.getBook(bookId)
        if (!book) {
          toast.error(i18n.t("reader_error_bookNotFound"))
          return
        }

        await StorageManager.saveBook({
          ...book,
          lastReadAt: Date.now(),
          progress: {
            chapterIndex,
            scroll: scrollPosition,
          },
        })

        await StorageManager.switchBook(bookId)
        await navigate("/reader")
        toast.success(i18n.t("reader_toast_readerOpened"))
      }
      catch (error) {
        log.reader.error("Open reader failed", error)
        toast.error(i18n.t("reader_toast_openFailed"))
      }
    },
    [navigate],
  )

  const continueReading = useCallback(
    async (bookId: string) => {
      try {
        const book = await StorageManager.getBook(bookId)
        if (!book) {
          toast.error(i18n.t("reader_error_bookNotFound"))
          return
        }

        await openReader({
          bookId,
          chapterIndex: book.progress?.chapterIndex || 0,
          scrollPosition: book.progress?.scroll || 0,
        })
      }
      catch (error) {
        log.reader.error("Continue reading failed", error)
        toast.error(i18n.t("reader_toast_continueFailed"))
      }
    },
    [openReader],
  )

  const startReading = useCallback(
    async (bookId: string) => {
      await openReader({ bookId })
    },
    [openReader],
  )

  return {
    openReader,
    continueReading,
    startReading,
  }
}
