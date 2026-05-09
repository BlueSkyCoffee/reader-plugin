import type { Book } from "@/types/novel"
import { i18n } from "#imports"
import { Icon } from "@iconify/react"
import { BookOpen, ExternalLink, HelpCircle, Library } from "lucide-react"
import { useEffect, useState } from "react"
import { browser } from "wxt/browser"
import { ModeToggle } from "@/components/app/mode-toggle"
import { MoreMenu } from "@/components/app/more-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"
import { version } from "../../../package.json"

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
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={() => onSelect(book.id)}
    >
      {/* 封面 */}
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

      {/* 信息 */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium truncate flex-1">{book.title}</span>
          {isActive && (
            <Badge variant="secondary" className="text-[9px] shrink-0 px-1 py-0">
              {i18n.t("bookcard_active")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-muted-foreground truncate">
            {book.author || i18n.t("common_unknown")}
          </span>
          <span className="text-[10px] text-muted-foreground/60 shrink-0">
            {total}
            {i18n.t("bookcard_chapters")}
          </span>
          {total > 0 && (
            <Badge variant="outline" className="text-[9px] shrink-0 px-1 py-0">
              {percent}
              %
            </Badge>
          )}
        </div>
      </div>
    </button>
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

  return (
    <>
      <div className="bg-background flex flex-col gap-3 px-4 pt-4 pb-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold leading-tight">Reader</h1>
            <Badge variant="secondary" className="text-[9px]">Beta</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => openOptions("/settings/help")}
              aria-label="帮助中心"
            >
              <HelpCircle />
            </Button>
            <ModeToggle />
          </div>
        </div>

        {/* Active reader session */}
        {activeBook && isHttpPage && (
          <div className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{activeBook.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {activeBook.author}
                {" · "}
                {i18n.t("popup.reader.chapterProgress", [activeBook.chapterIndex + 1, activeBook.totalChapters])}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 shrink-0 gap-1 text-xs"
              onClick={handleOpenReader}
            >
              <ExternalLink />
              {i18n.t("popup.reader.open")}
            </Button>
          </div>
        )}

        <Separator />

        {/* Book list */}
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
                  {i18n.t("popup.reader.noActiveSession")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => openOptions("/search")}
                >
                  {i18n.t("popup.search")}
                </Button>
              </div>
            )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 hover:bg-muted transition-colors"
          onClick={() => browser.runtime.openOptionsPage()}
        >
          <Icon icon="tabler:settings" className="size-3.5" strokeWidth={1.6} />
          <span className="text-[11px] font-medium">
            {i18n.t("popup.options")}
          </span>
        </button>
        <span className="text-[10px] text-muted-foreground">
          v
          {version}
        </span>
        <MoreMenu />
      </div>
    </>
  )
}

export default App
