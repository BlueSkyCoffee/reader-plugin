import type { Book } from "@/types/novel"

import { Download, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { browser } from "wxt/browser"
import { PageLayout } from "@/components/app/page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { EpubGenerator } from "@/lib/epub-generator"
import { StorageManager } from "@/lib/storage"
import { TxtGenerator } from "@/lib/txt-generator"
import { log } from "@/utils/logger"

export function DownloadPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [storageUsed, setStorageUsed] = useState<string>(browser.i18n.getMessage("download_stats_calculating"))

  const loadData = async () => {
    try {
      setIsLoading(true)
      const bookshelf = await StorageManager.getBookshelf()
      setBooks(bookshelf)

      const info = await StorageManager.getStorageInfo()
      setStorageUsed(info.estimatedSize)
    }
    catch (error) {
      log.download.error("Load data failed", error)
      toast.error(browser.i18n.getMessage("download_toast_loadFailed"))
    }
    finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleDownloadBook = async (book: Book, format: "epub" | "txt" = "epub") => {
    setDownloadingId(book.id)
    try {
      const chapters = await StorageManager.getBookChapters(book.id)

      if (!chapters || chapters.length === 0) {
        toast.error(browser.i18n.getMessage("download_toast_emptyBook"))
        return
      }

      if (format === "txt") {
        const generator = new TxtGenerator(book, chapters)
        await generator.generateAndDownload()
      }
      else {
        const generator = new EpubGenerator(book, chapters)
        await generator.generateAndDownload()
      }

      toast.success(browser.i18n.getMessage("download_toast_exportSuccess", [book.title]))
    }
    catch (error) {
      log.download.error("Export failed", error)
      toast.error(browser.i18n.getMessage("download_toast_exportFailed"))
    }
    finally {
      setDownloadingId(null)
    }
  }

  return (
    <PageLayout
      title={browser.i18n.getMessage("download_title")}
      description={browser.i18n.getMessage("download_description")}
    >
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{browser.i18n.getMessage("download_stats_cached")}</p>
              {isLoading
                ? <Skeleton className="mt-2 h-7 w-16" />
                : <p className="mt-1 text-2xl font-bold">{books.length}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{browser.i18n.getMessage("download_stats_storage")}</p>
              {isLoading
                ? <Skeleton className="mt-2 h-7 w-24" />
                : <p className="mt-1 text-2xl font-bold">{storageUsed}</p>}
            </CardContent>
          </Card>
        </div>

        {/* Exportable Books */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{browser.i18n.getMessage("download_section_exportable")}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading
              ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-14 w-full rounded-lg" />
                    ))}
                  </div>
                )
              : books.length > 0
                ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {books.map(book => (
                        <div
                          key={book.id}
                          className="flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:border-primary/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium" title={book.title}>
                              {book.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {book.author || browser.i18n.getMessage("common_unknown")}
                              {" "}
                              &middot;
                              {" "}
                              <Badge variant="secondary" className="text-[10px]">
                                {book.totalChapters}
                                {" "}
                                {browser.i18n.getMessage("download_unit_chapter")}
                              </Badge>
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-xs"
                                disabled={downloadingId === book.id}
                              >
                                {downloadingId === book.id ? browser.i18n.getMessage("download_actions_exporting") : browser.i18n.getMessage("download_actions_export")}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleDownloadBook(book, "epub")}>
                                <Download data-icon="inline-start" />
                                EPUB
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownloadBook(book, "txt")}>
                                <FileText data-icon="inline-start" />
                                TXT
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                    </div>
                  )
                : (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Download />
                        </EmptyMedia>
                        <EmptyTitle>{browser.i18n.getMessage("download_empty_exportable_title")}</EmptyTitle>
                        <EmptyDescription>{browser.i18n.getMessage("download_empty_exportable_desc")}</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
