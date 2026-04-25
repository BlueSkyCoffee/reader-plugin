import type { Book, Chapter } from "@/types/novel"
import { BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { i18n } from "@/i18n"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"
import { ChapterSelector } from "./components/chapter-selector"

interface ReaderPageProps {
  bookId?: string
  onClose?: () => void
}

export function ReaderPage({ bookId, onClose }: ReaderPageProps) {
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const loadBook = useCallback(async () => {
    try {
      setIsLoading(true)

      const targetBookId = bookId || (await StorageManager.getActiveBookId())

      if (!targetBookId) {
        toast.error(i18n.t("reader_error_noBookSelected"))
        return
      }

      const activeBook = await StorageManager.getBook(targetBookId)

      if (!activeBook) {
        toast.error(i18n.t("reader_error_bookNotFound"))
        return
      }

      const bookChapters = await StorageManager.getBookChapters(activeBook.id)

      if (!bookChapters || bookChapters.length === 0) {
        toast.error(i18n.t("reader_error_emptyContent"))
        return
      }

      setBook(activeBook)
      setChapters(bookChapters)
      setCurrentChapterIndex(activeBook.progress?.chapterIndex ?? 0)
    }
    catch (error) {
      log.reader.error("Load book failed", error)
      toast.error(i18n.t("reader_error_loadFailed"))
    }
    finally {
      setIsLoading(false)
    }
  }, [bookId])

  useEffect(() => {
    void loadBook()
  }, [loadBook])

  const handleChapterChange = (index: number) => {
    if (index >= 0 && index < chapters.length) {
      setCurrentChapterIndex(index)
    }
  }

  const handlePrevChapter = () => {
    if (currentChapterIndex > 0) {
      handleChapterChange(currentChapterIndex - 1)
    }
  }

  const handleNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      handleChapterChange(currentChapterIndex + 1)
    }
  }

  const saveProgress = useCallback(async () => {
    if (!book)
      return
    try {
      await StorageManager.saveBook({
        ...book,
        progress: {
          chapterIndex: currentChapterIndex,
          scroll: 0,
        },
      })
    }
    catch (error) {
      log.reader.error("Save progress failed", error)
    }
  }, [book, currentChapterIndex])

  useEffect(() => {
    void saveProgress()
  }, [saveProgress])

  const currentChapter = chapters[currentChapterIndex]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <BookOpen className="size-12 opacity-30 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">{i18n.t("reader_loading")}</p>
        </div>
      </div>
    )
  }

  if (!book || !currentChapter) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <BookOpen className="size-12 opacity-30 mx-auto mb-4" />
          <p className="text-muted-foreground">{i18n.t("reader_error_notFound")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg line-clamp-1">{book.title}</h1>
            <p className="text-xs text-muted-foreground">
              {currentChapterIndex + 1}
              {" "}
              /
              {chapters.length}
            </p>
          </div>

          <ChapterSelector
            chapters={chapters}
            currentChapterIndex={currentChapterIndex}
            onSelectChapter={handleChapterChange}
          />

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title={i18n.t("reader_nav_closeReader")}
            >
              <X className="size-5" />
            </Button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full w-full">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {currentChapter.title}
            </h2>

            <div className="prose prose-sm dark:prose-invert max-w-none mb-8 leading-relaxed">
              <p className="whitespace-pre-wrap text-base text-foreground/90">
                {currentChapter.content}
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>

      <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={handlePrevChapter}
            disabled={currentChapterIndex === 0}
            className="gap-2"
          >
            <ChevronLeft className="size-4" data-icon="inline-start" />
            {i18n.t("reader_nav_prevChapter")}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            {currentChapterIndex + 1}
            {" "}
            /
            {chapters.length}
          </div>

          <Button
            variant="outline"
            onClick={handleNextChapter}
            disabled={currentChapterIndex === chapters.length - 1}
            className="gap-2"
          >
            {i18n.t("reader_nav_nextChapter")}
            <ChevronRight className="size-4" data-icon="inline-end" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
