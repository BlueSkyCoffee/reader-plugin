import type { Book } from "@/types/novel"
import { BookOpen, ExternalLink, Library } from "lucide-react"
import { useEffect, useState } from "react"
import { browser } from "wxt/browser"
import { PopupLayout } from "@/components/layout/popup-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"

interface ActiveBookInfo {
  bookId: string
  title: string
  author: string
  totalChapters: number
  chapterIndex: number
}

function PopupBookCard({
  book,
  isActive,
  onSelect,
}: {
  book: Book
  isActive: boolean
  onSelect: (id: string) => void
}) {
  const total = book.totalChapters || 0
  const current = book.progress?.chapterIndex || 0
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2.5 rounded-lg px-2.5 py-2 h-auto"
      onClick={() => onSelect(book.id)}
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {book.cover
          ? (
              <img src={book.cover} alt={book.title} className="size-full object-cover" />
            )
          : (
              <div className="flex size-full items-center justify-center">
                <BookOpen className="size-4 text-muted-foreground/40" />
              </div>
            )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate flex-1">{book.title}</span>
          {isActive && (
            <Badge variant="secondary" className="text-[9px] shrink-0 px-1 py-0">
              {browser.i18n.getMessage("bookcard_active")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-muted-foreground truncate">
            {book.author || browser.i18n.getMessage("common_unknown")}
          </span>
          <span className="text-[10px] text-muted-foreground/60 shrink-0">
            {total}
            {browser.i18n.getMessage("bookcard_chapters")}
          </span>
          {total > 0 && (
            <Badge variant="outline" className="text-[9px] shrink-0 px-1 py-0">
              {percent}
              %
            </Badge>
          )}
        </div>
      </div>
    </Button>
  )
}

function App() {
  const [activeBook, setActiveBook] = useState<ActiveBookInfo | null>(null)
  const [isHttpPage, setIsHttpPage] = useState(false)
  const [books, setBooks] = useState<Book[]>([])
  const [activeBookId, setActiveBookId] = useState<string | null>(null)

  const openOptions = (path: string) => {
    const url = browser.runtime.getURL(`/options.html#${path}`)
    return browser.tabs.create({ url })
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [session, bookId, allBooks] = await Promise.all([
          StorageManager.getActiveReaderSession(),
          StorageManager.getActiveBookId(),
          StorageManager.getBookshelf(),
        ])

        if (session && bookId) {
          setActiveBook({
            bookId,
            title: session.title,
            author: session.author,
            totalChapters: session.totalChapters,
            chapterIndex: session.chapterIndex,
          })
        }
        setActiveBookId(bookId)
        setBooks(allBooks)
      }
      catch (error) {
        log.popup.error("Load data failed", error)
      }
    }

    const checkCurrentPage = async () => {
      try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
        if (tab?.url) {
          setIsHttpPage(tab.url.startsWith("http://") || tab.url.startsWith("https://"))
        }
      }
      catch (error) {
        log.popup.error("Check current page failed", error)
      }
    }

    void loadData()
    void checkCurrentPage()
  }, [])

  const handleOpenReader = async () => {
    if (!activeBook || !isHttpPage)
      return

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id)
        return

      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: (bookId, chapterIndex, scroll) => {
          window.dispatchEvent(new CustomEvent("show-reader", {
            detail: { bookId, chapterIndex, scroll },
          }))
        },
        args: [activeBook.bookId, activeBook.chapterIndex, 0],
      })
      window.close()
    }
    catch (error) {
      log.popup.error("Open reader failed", error)
    }
  }

  const handleSelectBook = (bookId: string) => {
    void openOptions(`/reader?bookId=${bookId}`)
  }

  const sessionHeader = activeBook && isHttpPage
    ? (
        <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{activeBook.title}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {activeBook.author}
              {" · "}
              {browser.i18n.getMessage("popup_reader_chapterProgress", [String(activeBook.chapterIndex + 1), String(activeBook.totalChapters)])}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 shrink-0 gap-1 text-xs"
            onClick={handleOpenReader}
          >
            <ExternalLink />
            {browser.i18n.getMessage("popup_reader_open")}
          </Button>
        </div>
      )
    : undefined

  return (
    <PopupLayout header={sessionHeader}>
      <Separator />

      {books.length > 0
        ? (
            <ScrollArea className="h-[340px] -mx-1 px-1">
              <div className="flex flex-col gap-0.5">
                {books.map(book => (
                  <PopupBookCard
                    key={book.id}
                    book={book}
                    isActive={book.id === activeBookId}
                    onSelect={handleSelectBook}
                  />
                ))}
              </div>
            </ScrollArea>
          )
        : (
            <div className="flex flex-col items-center justify-center gap-2 py-10">
              <Library className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground text-center">
                {browser.i18n.getMessage("popup_reader_noActiveSession")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => openOptions("/search")}
              >
                {browser.i18n.getMessage("popup_search")}
              </Button>
            </div>
          )}
    </PopupLayout>
  )
}

export default App
