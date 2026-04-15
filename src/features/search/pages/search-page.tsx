import type { Book, Chapter, ScraperRule, SearchResult as ScraperSearchResult } from "@/types/novel"

import {
  BookPlus,
  Download,
  ExternalLink,
  Info,
  Loader2,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { DownloadManager } from "@/features/download/services/download-manager"
import { BUILTIN_RULES, ScraperEngine } from "@/features/scraper/services"
import { SearchBar } from "@/shared/components/app/search-bar"
import { PageLayout } from "@/shared/components/layout/page-layout"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { i18n } from "@/shared/i18n"
import { StorageManager } from "@/shared/infra/storage"
import { EpubGenerator } from "@/shared/services/epub-generator"

export function SearchPage() {
  const [query, setQuery] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [results, setResults] = useState<ScraperSearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)

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
          console.error(`[Search] ${rule.name} failed:`, e)
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
      console.error("Search error:", error)
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
      console.error("Add to shelf error:", error)
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
      console.error("Direct download error:", error)
      toast.error(i18n.t("search.toast.downloadFailed"))
    }
    finally {
      setDownloadingId(null)
    }
  }

  return (
    <PageLayout title={i18n.t("search.title")}>
      <div className="space-y-6">
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
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : i18n.t("search.action")}
            </Button>
          )}
        />

        {hasSearched && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
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
                <span className="text-xs text-muted-foreground animate-pulse">
                  {i18n.t("search.results.loading")}
                </span>
              )}
            </div>

            {results.length > 0
              ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.map((result) => {
                      const sourceName
                        = BUILTIN_RULES.find(r => r.id === result.sourceId)?.name
                          || i18n.t("search.source.custom")
                      return (
                        <div
                          key={`${result.sourceId}-${result.url}`}
                          className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm transition-all flex flex-col gap-3"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <h3
                                className="font-semibold text-sm line-clamp-1"
                                title={result.bookName}
                              >
                                {result.bookName}
                              </h3>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {result.author || i18n.t("common.anonymous")}
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-[10px] shrink-0">
                              {sourceName}
                            </Badge>
                          </div>

                          <div className="text-xs text-muted-foreground space-y-1 bg-muted/50 p-2 rounded border border-border/50">
                            {result.latestChapter && (
                              <p className="line-clamp-1" title={result.latestChapter}>
                                {i18n.t("search.result.latest")}
                                {result.latestChapter}
                              </p>
                            )}
                            {result.lastUpdateTime && (
                              <p>
                                {i18n.t("search.result.updated")}
                                {result.lastUpdateTime}
                              </p>
                            )}
                          </div>

                          <div className="mt-auto pt-2 flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1 h-8"
                                onClick={() => handleAddToShelf(result)}
                              >
                                <BookPlus className="w-3.5 h-3.5 mr-1" />
                                {i18n.t("search.actions.addToShelf")}
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="flex-1 h-8"
                                onClick={() => handleDownloadDirectly(result)}
                                disabled={downloadingId === result.url}
                              >
                                {downloadingId === result.url
                                  ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    )
                                  : (
                                      <>
                                        <Download className="w-3.5 h-3.5 mr-1" />
                                        EPUB
                                      </>
                                    )}
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full h-7 text-xs"
                              asChild
                            >
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {i18n.t("search.actions.sourceSite")}
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </a>
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              : (
                  !isLoading && (
                    <div className="py-16 text-center">
                      <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <h3 className="font-medium text-sm mb-1">{i18n.t("search.empty.title")}</h3>
                      <p className="text-xs text-muted-foreground">
                        {i18n.t("search.empty.description")}
                      </p>
                    </div>
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
