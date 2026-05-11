import { browser } from "wxt/browser"
import type { Book, Chapter, ScraperRule, SearchResult as ScraperSearchResult } from "@/types/novel"

import { Grid2X2, Info, List, Loader2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { SearchBar } from "@/components/app/search-bar"
import { PageLayout } from "@/components/app/page-layout"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DownloadManager } from "@/features/download/download-manager"
import { BUILTIN_RULES, ScraperEngine } from "@/features/scraper/services"
import { EpubGenerator } from "@/lib/epub-generator"
import { StorageManager } from "@/lib/storage"
import { cn } from "@/utils"
import { log } from "@/utils/logger"
import { sortSearchResults } from "@/utils/string-similarity"
import { SearchResultCard } from "./search-result-card"

type NovelLayout = "grid" | "list"
const SEARCH_LAYOUT_STORAGE_KEY = "search-result-layout"

function getInitialSearchLayout(): NovelLayout {
  if (typeof window === "undefined") {
    return "list"
  }

  try {
    const savedLayout = window.localStorage.getItem(SEARCH_LAYOUT_STORAGE_KEY)
    return savedLayout === "grid" ? "grid" : "list"
  }
  catch {
    return "list"
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
      toast.error(browser.i18n.getMessage("search_toast_emptyQuery"))
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
          toast.error(browser.i18n.getMessage("search_toast_tocFailedBlocked"))
          return
        }

        setResults([
          {
            sourceId: directRule.id,
            url: trimmedQuery,
            bookName: info.bookName,
            author: info.author || browser.i18n.getMessage("common_unknown"),
            latestChapter: info.latestChapter,
            lastUpdateTime: info.lastUpdateTime,
            category: info.category,
            status: info.status,
            wordCount: info.wordCount,
          },
        ])
        toast.success(browser.i18n.getMessage("search_toast_parsedToc", [info.bookName, String(toc.length)]))
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

      // 按相似度排序搜索结果
      const sortedResults = sortSearchResults(
        trimmedQuery,
        allResults,
        r => r.bookName,
        r => r.author,
      )

      setResults(sortedResults)

      if (allResults.length === 0) {
        if (failedSources.length > 0) {
          toast.error(browser.i18n.getMessage("search_toast_searchFailed", [failedSources.join(", ")]))
        }
        else {
          toast.info(browser.i18n.getMessage("search_toast_noResults"))
        }
      }
      else {
        toast.success(browser.i18n.getMessage("search_toast_resultsFound", [String(allResults.length)]))
      }
    }
    catch (error) {
      log.search.error("Search failed", error)
      toast.error(browser.i18n.getMessage("search_toast_error"))
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
      toast.error(browser.i18n.getMessage("search_toast_ruleNotFound"))
      return
    }

    toast.info(browser.i18n.getMessage("search_toast_fetchInfo", [result.bookName]))

    try {
      const engine = new ScraperEngine(rule)
      const { info, toc } = await engine.getBookInfo(result.url)

      if (!toc || !toc.length) {
        toast.error(browser.i18n.getMessage("search_toast_tocFailedBlocked"))
        return
      }

      const bookshelf = await StorageManager.getBookshelf()

      if (
        bookshelf.some(
          b => b.title === info.bookName && b.author === info.author,
        )
      ) {
        toast.warning(browser.i18n.getMessage("search_toast_duplicateBook"))
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

      toast.success(browser.i18n.getMessage("search_toast_addedToShelf", [info.bookName]))
      void DownloadManager.getInstance().startDownload(newBook, result.sourceId)
    }
    catch (error) {
      log.search.error("Add to shelf failed", error)
      toast.error(browser.i18n.getMessage("search_toast_addFailed"))
    }
  }

  const handleDownloadDirectly = async (result: ScraperSearchResult) => {
    const rules = await StorageManager.getRules()
    const rule
      = rules.find(r => r.id === result.sourceId)
        || BUILTIN_RULES.find(r => r.id === result.sourceId)

    if (!rule) {
      toast.error(browser.i18n.getMessage("search_toast_ruleNotFound"))
      return
    }

    setDownloadingId(result.url)
    toast.info(browser.i18n.getMessage("search_toast_prepareDownload", [result.bookName]))

    try {
      const engine = new ScraperEngine(rule)
      const { info, toc } = await engine.getBookInfo(result.url)

      if (!toc || !toc.length) {
        toast.error(browser.i18n.getMessage("search_toast_tocFailed"))
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
              browser.i18n.getMessage("search_toast_downloading", [String(task.downloadedChapters), String(task.totalChapters)]),
              { id: "direct-download" },
            )
          }
        })
      })

      toast.success(browser.i18n.getMessage("search_toast_packEpub"), { id: "direct-download" })

      const fullChapters = await StorageManager.getBookChapters(tempBookId)
      const generator = new EpubGenerator(book, fullChapters)
      await generator.generateAndDownload()

      await StorageManager.deleteBook(tempBookId)

      toast.success(browser.i18n.getMessage("search_toast_exported", [info.bookName]))
    }
    catch (error) {
      log.search.error("Direct download failed", error)
      toast.error(browser.i18n.getMessage("search_toast_downloadFailed"))
    }
    finally {
      setDownloadingId(null)
    }
  }

  return (
    <PageLayout title={browser.i18n.getMessage("search_title")} description={browser.i18n.getMessage("search_description")}>
      <div className="flex flex-col gap-6">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={browser.i18n.getMessage("search_placeholder")}
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
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : browser.i18n.getMessage("search_action")}
            </Button>
          )}
        />

        {hasSearched && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold">
                {browser.i18n.getMessage("search_results_title")}
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
                    {browser.i18n.getMessage("search_results_loading")}
                  </span>
                </div>
              )}
              <Tabs
                value={layout}
                onValueChange={value => handleLayoutChange(value as NovelLayout)}
              >
                <TabsList>
                  <TabsTrigger value="grid">
                    <Grid2X2 className="size-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <List className="size-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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
                          || browser.i18n.getMessage("search_source_custom")
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
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Info />
                        </EmptyMedia>
                        <EmptyTitle>{browser.i18n.getMessage("search_empty_title")}</EmptyTitle>
                        <EmptyDescription>{browser.i18n.getMessage("search_empty_description")}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
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
