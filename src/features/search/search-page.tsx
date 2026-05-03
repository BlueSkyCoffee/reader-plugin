import type { Book, Chapter, ScraperRule, SearchResult as ScraperSearchResult } from "@/types/novel"

import { Grid2X2, Info, List, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { EmptyState } from "@/components/app/empty-state"
import { SearchBar } from "@/components/app/search-bar"
import { PageLayout } from "@/components/layout/page-layout"
import { Button } from "@/components/ui/button"
import { DownloadManager } from "@/features/download/download-manager"
import { BUILTIN_RULES, ScraperEngine } from "@/features/scraper/services"
import { i18n } from "@/i18n"
import { EpubGenerator } from "@/lib/epub-generator"
import { StorageManager } from "@/lib/storage"
import { cn } from "@/utils/cn"
import { log } from "@/utils/logger"
import { SearchResultCard } from "./search-result-card"

type NovelLayout = "grid" | "list"
const SEARCH_LAYOUT_STORAGE_KEY = "search-result-layout"

function getInitialSearchLayout(): NovelLayout {
  if (typeof window === "undefined") {
    return "grid"
  }

  try {
    const savedLayout = window.localStorage.getItem(SEARCH_LAYOUT_STORAGE_KEY)
    return savedLayout === "list" ? "list" : "grid"
  }
  catch {
    return "grid"
  }
}

export function SearchPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [results, setResults] = useState<ScraperSearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [layout, setLayout] = useState<NovelLayout>(getInitialSearchLayout)

  const handleLayoutChange = (nextLayout: NovelLayout) => {
    setLayout(nextLayout)
    try {
      window.localStorage.setItem(SEARCH_LAYOUT_STORAGE_KEY, nextLayout)
    }
    catch {
      // Layout persistence is optional.
    }
  }

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error(i18n.t("search.toast.emptyQuery"))
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    setResults([])

    try {
      const allResults: ScraperSearchResult[] = []
      const failedSources: string[] = []

      const rules = await StorageManager.getRules()
      const activeRules = rules.length > 0 ? rules : BUILTIN_RULES

      const trimmedQuery = query.trim()
      const directRule = findRuleByUrl(trimmedQuery, activeRules)
      if (directRule) {
        const engine = new ScraperEngine(directRule)
        const { info, toc } = await engine.getBookInfo(trimmedQuery)
        if (!toc || toc.length === 0) {
          toast.error(i18n.t("search.toast.tocFailedBlocked"))
          return
        }

        setResults([
          {
            sourceId: directRule.id,
            url: trimmedQuery,
            bookName: info.bookName,
            author: info.author || i18n.t("common.unknown"),
            latestChapter: info.latestChapter,
            lastUpdateTime: info.lastUpdateTime,
            category: info.category,
            status: info.status,
            wordCount: info.wordCount,
          },
        ])
        toast.success(i18n.t("search.toast.parsedToc", { title: info.bookName, count: toc.length }))
        return
      }

      const searchableRules = activeRules.filter(rule => rule.search && !rule.search.disabled && !rule.disabled)

      const searchPromises = searchableRules.map(async (rule) => {
        const engine = new ScraperEngine(rule)
        try {
          const res = await engine.search(trimmedQuery)
          return res
        }
        catch (e) {
          log.search.error(`${rule.name} search failed`, e)
          failedSources.push(rule.name)
          return []
        }
      })

      const resultsArray = await Promise.all(searchPromises)
      resultsArray.forEach((res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          allResults.push(...res)
        }
      })

      setResults(allResults)

      if (allResults.length === 0) {
        if (failedSources.length > 0) {
          toast.error(i18n.t("search.toast.searchFailed", { sources: failedSources.join(", ") }))
        }
        else {
          toast.info(i18n.t("search.toast.noResults"))
        }
      }
      else {
        toast.success(i18n.t("search.toast.resultsFound", { count: allResults.length }))
      }
    }
    catch (error) {
      log.search.error("Search failed", error)
      toast.error(i18n.t("search.toast.error"))
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleAddToShelf = async (result: ScraperSearchResult) => {
    const rules = await StorageManager.getRules()
    const rule
      = rules.find(r => r.id === result.sourceId)
        || BUILTIN_RULES.find(r => r.id === result.sourceId)

    if (!rule) {
      toast.error(i18n.t("search.toast.ruleNotFound"))
      return
    }

    toast.info(i18n.t("search.toast.fetchInfo", { title: result.bookName }))

    try {
      const engine = new ScraperEngine(rule)
      const { info, toc } = await engine.getBookInfo(result.url)

      if (!toc || !toc.length) {
        toast.error(i18n.t("search.toast.tocFailedBlocked"))
        return
      }

      const bookshelf = await StorageManager.getBookshelf()

      if (
        bookshelf.some(
          b => b.title === info.bookName && b.author === info.author,
        )
      ) {
        toast.warning(i18n.t("search.toast.duplicateBook"))
        return
      }

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

      const unifiedChapters: Chapter[] = toc.map((t, i) => ({
        bookId: newBookId,
        title: t.title,
        content: "",
        url: t.url,
        order: i + 1,
      }))

      await StorageManager.saveBook(newBook, unifiedChapters)
      await StorageManager.switchBook(newBookId)

      toast.success(i18n.t("search.toast.addedToShelf", { title: info.bookName }))
      void DownloadManager.getInstance().startDownload(newBook, result.sourceId)
    }
    catch (error) {
      log.search.error("Add to shelf failed", error)
      toast.error(i18n.t("search.toast.addFailed"))
    }
  }

  const handleDownloadDirectly = async (result: ScraperSearchResult) => {
    const rules = await StorageManager.getRules()
    const rule
      = rules.find(r => r.id === result.sourceId)
        || BUILTIN_RULES.find(r => r.id === result.sourceId)

    if (!rule) {
      toast.error(i18n.t("search.toast.ruleNotFound"))
      return
    }

    setDownloadingId(result.url)
    toast.info(i18n.t("search.toast.prepareDownload", { title: result.bookName }))

    try {
      const engine = new ScraperEngine(rule)
      const { info, toc } = await engine.getBookInfo(result.url)

      if (!toc || !toc.length) {
        toast.error(i18n.t("search.toast.tocFailed"))
        return
      }

      const tempBookId = `temp-${Date.now()}`
      const book: Book = {
        id: tempBookId,
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
        bookId: tempBookId,
        title: t.title,
        content: "",
        url: t.url,
        order: i + 1,
      }))

      await StorageManager.saveBook(book, chapters)

      const manager = DownloadManager.getInstance()
      void manager.startDownload(book, result.sourceId)

      await new Promise<void>((resolve, reject) => {
        const unsubscribe = manager.onProgress(tempBookId, (task) => {
          if (task.status === "completed") {
            unsubscribe()
            resolve()
          }
          else if (task.status === "error") {
            unsubscribe()
            reject(new Error(task.error))
          }
          else {
            toast.message(
              i18n.t("search.toast.downloading", {
                current: task.downloadedChapters,
                total: task.totalChapters,
              }),
              { id: "direct-download" },
            )
          }
        })
      })

      toast.success(i18n.t("search.toast.packEpub"), { id: "direct-download" })

      const fullChapters = await StorageManager.getBookChapters(tempBookId)
      const generator = new EpubGenerator(book, fullChapters)
      await generator.generateAndDownload()

      await StorageManager.deleteBook(tempBookId)

      toast.success(i18n.t("search.toast.exported", { title: info.bookName }))
    }
    catch (error) {
      log.search.error("Direct download failed", error)
      toast.error(i18n.t("search.toast.downloadFailed"))
    }
    finally {
      setDownloadingId(null)
    }
  }

  return (
    <PageLayout title={i18n.t("search.title")}>
      <div className="flex flex-col gap-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={i18n.t("search.placeholder")}
          className="w-full"
          inputClassName="w-full pr-24 py-6 text-base bg-background"
          onSubmit={(event) => {
            event.preventDefault()
            void handleSearch()
          }}
          action={(
            <Button
              className="h-8 px-4"
              disabled={isLoading}
              size="sm"
              type="submit"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : i18n.t("search.action")}
            </Button>
          )}
        />

        {hasSearched && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                {i18n.t("search.results.title")}
                {" "}
                <span className="text-muted-foreground">
                  (
                  {results.length}
                  )
                </span>
              </h2>
              {isLoading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    {i18n.t("search.results.loading")}
                  </span>
                </div>
              )}
              <div className="flex shrink-0 items-center rounded-lg border bg-background p-1">
                <Button
                  type="button"
                  size="icon"
                  variant={layout === "grid" ? "secondary" : "ghost"}
                  className={cn("size-8", layout === "grid" && "shadow-sm")}
                  aria-label={i18n.t("search.layout.grid")}
                  title={i18n.t("search.layout.grid")}
                  onClick={() => handleLayoutChange("grid")}
                >
                  <Grid2X2 className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant={layout === "list" ? "secondary" : "ghost"}
                  className={cn("size-8", layout === "list" && "shadow-sm")}
                  aria-label={i18n.t("search.layout.list")}
                  title={i18n.t("search.layout.list")}
                  onClick={() => handleLayoutChange("list")}
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>

            {results.length > 0
              ? (
                  <div
                    className={cn(
                      layout === "grid"
                        ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        : "flex flex-col gap-3",
                    )}
                  >
                    {results.map((result) => {
                      const sourceName
                        = BUILTIN_RULES.find(r => r.id === result.sourceId)?.name
                          || i18n.t("search.source.custom")
                      return (
                        <SearchResultCard
                          key={`${result.sourceId}-${result.url}`}
                          result={result}
                          sourceName={sourceName}
                          layout={layout}
                          onAddToShelf={handleAddToShelf}
                          onDownload={handleDownloadDirectly}
                          isDownloading={downloadingId === result.url}
                        />
                      )
                    })}
                  </div>
                )
              : (
                  !isLoading && (
                    <EmptyState
                      title={i18n.t("search.empty.title")}
                      description={i18n.t("search.empty.description")}
                      icon={<Info className="size-8 opacity-50" />}
                    />
                  )
                )}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

function findRuleByUrl(value: string, rules: ScraperRule[]) {
  try {
    const normalized = new URL(value).href
    return rules.find(rule => normalized.startsWith(rule.url))
  }
  catch {
    return undefined
  }
}
