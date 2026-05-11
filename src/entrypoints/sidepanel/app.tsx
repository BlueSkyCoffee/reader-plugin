import type { Book, Chapter, SearchResult } from "@/types/novel"
import type { ScraperRule } from "@/types/novel"
import { BookOpen, ChevronLeft, ChevronRight, Library, Search } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { browser } from "wxt/browser"
import { SidePanelLayout } from "@/components/layout/sidepanel-layout"
import { SearchBar } from "@/components/app/search-bar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BUILTIN_RULES, ScraperEngine } from "@/features/scraper/services"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"

type TabValue = "bookshelf" | "search" | "reader"

function App() {
  const [tab, setTab] = useState<TabValue>("bookshelf")

  return (
    <SidePanelLayout
      nav={(
        <Tabs value={tab} onValueChange={v => setTab(v as TabValue)}>
          <TabsList className="w-full grid grid-cols-3 h-8">
            <TabsTrigger value="bookshelf" className="gap-1 text-xs">
              <Library className="size-3" />
              {browser.i18n.getMessage("bookshelf_title")}
            </TabsTrigger>
            <TabsTrigger value="search" className="gap-1 text-xs">
              <Search className="size-3" />
              {browser.i18n.getMessage("search_title")}
            </TabsTrigger>
            <TabsTrigger value="reader" className="gap-1 text-xs">
              <BookOpen className="size-3" />
              {browser.i18n.getMessage("reader_bar_title")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    >
      {tab === "bookshelf" && <BookshelfView onNavigateToReader={() => setTab("reader")} />}
      {tab === "search" && <SearchView />}
      {tab === "reader" && <ReaderView />}
    </SidePanelLayout>
  )
}

// === 书架视图 ===

function BookshelfView({ onNavigateToReader }: { onNavigateToReader: () => void }) {
  const [books, setBooks] = useState<Book[]>([])
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadBooks = useCallback(async () => {
    setIsLoading(true)
    try {
      const [list, activeId] = await Promise.all([
        StorageManager.getBookshelf(),
        StorageManager.getActiveBookId(),
      ])
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

  const handleSelect = async (bookId: string) => {
    try {
      await StorageManager.switchBook(bookId)
      setActiveBookId(bookId)
      onNavigateToReader()
    }
    catch (e) {
      log.bookshelf.error("Switch book failed", e)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2.5 px-2.5 py-2">
            <Skeleton className="size-10 shrink-0 rounded-md" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Library className="size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground text-center">
          {browser.i18n.getMessage("popup_reader_noActiveSession")}
        </p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-3">
        {books.map(book => (
          <BookItem
            key={book.id}
            book={book}
            isActive={book.id === activeBookId}
            onSelect={() => void handleSelect(book.id)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}

function BookItem({ book, isActive, onSelect }: { book: Book, isActive: boolean, onSelect: () => void }) {
  const total = book.totalChapters || 0
  const current = book.progress?.chapterIndex || 0
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={onSelect}
    >
      <div className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
        {book.cover
          ? <img src={book.cover} alt={book.title} className="size-full object-cover" />
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
    </button>
  )
}

// === 搜索视图 ===

function SearchView() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [activeRules, setActiveRules] = useState<ScraperRule[]>([])

  useEffect(() => {
    void StorageManager.getSettings().then((s) => {
      const custom = s.customRules ?? []
      setActiveRules([...BUILTIN_RULES, ...custom])
    })
  }, [])

  const handleSearch = async () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setIsLoading(true)
    setHasSearched(true)

    const searchableRules = activeRules.filter(r => r.search && !r.search.disabled && !r.disabled)
    const failedSources: string[] = []
    const allResults: SearchResult[] = []

    try {
      const promises = searchableRules.map(async (rule) => {
        const engine = new ScraperEngine(rule)
        try {
          return await engine.search(trimmed)
        }
        catch (e) {
          log.scraper.error(`${rule.name} search failed`, e)
          failedSources.push(rule.name)
          return []
        }
      })

      const resultsArray = await Promise.all(promises)
      resultsArray.forEach((res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          allResults.push(...res)
        }
      })
      setResults(allResults)
    }
    catch (e) {
      log.scraper.error("Search failed", e)
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleAddToShelf = async (result: SearchResult) => {
    const rule = activeRules.find(r => r.id === result.sourceId)
    if (!rule) return

    try {
      const engine = new ScraperEngine(rule)
      const { info, toc } = await engine.getBookInfo(result.url)
      if (!toc || toc.length === 0) return

      const bookshelf = await StorageManager.getBookshelf()
      if (bookshelf.some(b => b.title === info.bookName && b.author === info.author)) return

      const newBookId = `scraper-${Date.now()}`
      const newBook: Book = {
        id: newBookId,
        title: info.bookName,
        author: info.author,
        cover: info.coverUrl,
        totalChapters: toc.length,
        addedAt: Date.now(),
        isScraped: true,
        sourceId: result.sourceId,
        bookUrl: result.url,
        source: "custom",
        sourceName: rule.name,
      }

      const chapters: Chapter[] = toc.map((t, i) => ({
        bookId: newBookId,
        title: t.title,
        content: "",
        url: t.url,
        index: i,
      }))

      await StorageManager.saveBook(newBook, chapters)
    }
    catch (e) {
      log.scraper.error("Add to shelf failed", e)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b shrink-0">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={browser.i18n.getMessage("search_placeholder")}
          onSubmit={(e) => {
            e.preventDefault()
            void handleSearch()
          }}
          action={(
            <Button
              size="sm"
              className="h-6 px-2 text-xs"
              disabled={isLoading}
              type="submit"
            >
              {isLoading ? "..." : browser.i18n.getMessage("search_action")}
            </Button>
          )}
        />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {isLoading
            ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2.5 px-2.5 py-2">
                      <Skeleton className="size-10 shrink-0 rounded-md" />
                      <div className="flex-1 flex flex-col gap-1.5">
                        <Skeleton className="h-3.5 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              )
            : results.length > 0
              ? (
                  <div className="flex flex-col gap-1">
                    {results.map((result, index) => (
                      <SearchResultItem
                        key={`${result.url}-${index}`}
                        result={result}
                        onSave={() => void handleAddToShelf(result)}
                      />
                    ))}
                  </div>
                )
              : hasSearched
                ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                      <Search className="size-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground text-center">
                        {browser.i18n.getMessage("search_empty_title")}
                      </p>
                    </div>
                  )
                : (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                      <Search className="size-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground text-center">
                        {browser.i18n.getMessage("search_placeholder")}
                      </p>
                    </div>
                  )}
        </div>
      </ScrollArea>
    </div>
  )
}

function SearchResultItem({ result, onSave }: { result: SearchResult, onSave: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted/50 transition-colors">
      <div className="size-10 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
        {result.coverUrl
          ? <img src={result.coverUrl} alt={result.bookName} className="size-full object-cover" />
          : <BookOpen className="size-4 text-muted-foreground/40" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium truncate">{result.bookName}</p>
        <p className="text-[11px] text-muted-foreground truncate">{result.author || browser.i18n.getMessage("common_unknown")}</p>
      </div>
      <Button variant="outline" size="sm" className="h-6 text-xs shrink-0" onClick={onSave}>
        {browser.i18n.getMessage("search_actions_addToShelf")}
      </Button>
    </div>
  )
}

// === 阅读视图 ===

function ReaderView() {
  const [activeBook, setActiveBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [content, setContent] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isFetching, setIsFetching] = useState(false)

  useEffect(() => {
    const loadActiveBook = async () => {
      setIsLoading(true)
      try {
        const bookId = await StorageManager.getActiveBookId()
        if (!bookId) return

        const book = await StorageManager.getBook(bookId)
        if (!book) return

        setActiveBook(book)
        setCurrentIndex(book.progress?.chapterIndex || 0)

        const bookChapters = await StorageManager.getBookChapters(bookId)
        setChapters(bookChapters)

        if (bookChapters.length > 0) {
          const idx = Math.min(book.progress?.chapterIndex || 0, bookChapters.length - 1)
          const chapter = bookChapters[idx]
          if (chapter?.content) {
            setContent(chapter.content)
          }
          setCurrentIndex(idx)
        }
      }
      catch (e) {
        log.reader.error("Load active book failed", e)
      }
      finally {
        setIsLoading(false)
      }
    }

    void loadActiveBook()
  }, [])

  const loadChapter = useCallback(async (index: number) => {
    if (!activeBook || index < 0 || index >= chapters.length) return

    setIsFetching(true)
    try {
      const chapter = chapters[index]
      if (chapter?.content) {
        setContent(chapter.content)
      }
      else {
        setContent(browser.i18n.getMessage("reader_loading"))
      }
      setCurrentIndex(index)

      // 保存进度
      await StorageManager.saveBook({
        ...activeBook,
        progress: { chapterIndex: index, scroll: 0 },
      })
    }
    catch (e) {
      log.reader.error("Load chapter failed", e)
    }
    finally {
      setIsFetching(false)
    }
  }, [activeBook, chapters])

  const handlePrev = () => {
    if (currentIndex > 0) void loadChapter(currentIndex - 1)
  }

  const handleNext = () => {
    if (currentIndex < chapters.length - 1) void loadChapter(currentIndex + 1)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!activeBook) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <BookOpen className="size-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground text-center">
          {browser.i18n.getMessage("popup_reader_noActiveSession")}
        </p>
      </div>
    )
  }

  const percent = chapters.length > 0 ? Math.round((currentIndex / chapters.length) * 100) : 0

  return (
    <div className="flex flex-col h-full">
      {/* 章节信息 */}
      <div className="border-b px-3 py-2 shrink-0">
        <p className="text-xs font-medium truncate">{activeBook.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {chapters[currentIndex]?.title || `${browser.i18n.getMessage("reader_nav_prevChapter")} ${currentIndex + 1}`}
        </p>
      </div>

      {/* 内容 */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-3 whitespace-pre-wrap text-sm leading-relaxed">
          {isFetching
            ? <span className="text-muted-foreground">{browser.i18n.getMessage("reader_loading")}</span>
            : content || <span className="text-muted-foreground">{browser.i18n.getMessage("reader_list_noMatch")}</span>}
        </div>
      </ScrollArea>

      {/* 底部控制 */}
      <div className="border-t px-3 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-xs tabular-nums text-muted-foreground">
          <span>
            {percent}
            %
          </span>
          <span className="opacity-40">|</span>
          <span>
            {currentIndex + 1}
            /
            {chapters.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={currentIndex <= 0}
            onClick={handlePrev}
          >
            <ChevronLeft className="size-3" />
            {browser.i18n.getMessage("reader_nav_prevChapter")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={currentIndex >= chapters.length - 1}
            onClick={handleNext}
          >
            {browser.i18n.getMessage("reader_nav_nextChapter")}
            <ChevronRight className="size-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
