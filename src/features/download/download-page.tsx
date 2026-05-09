import type { Book } from "@/types/novel"
import { i18n } from "#imports"
import { Download, FileText } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { EmptyState } from "@/components/app/empty-state"
import { MiniCard } from "@/components/app/mini-card"
import { StatCard, StatGrid } from "@/components/app/stat-card"
import { PageLayout } from "@/components/layout/page-layout"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EpubGenerator } from "@/lib/epub-generator"
import { StorageManager } from "@/lib/storage"
import { TxtGenerator } from "@/lib/txt-generator"
import { log } from "@/utils/logger"

export function DownloadPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [storageUsed, setStorageUsed] = useState<string>(i18n.t("download.stats.calculating"))

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
      toast.error(i18n.t("download.toast.loadFailed"))
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
        toast.error(i18n.t("download.toast.emptyBook"))
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

      toast.success(i18n.t("download.toast.exportSuccess", [book.title]))
    }
    catch (error) {
      log.download.error("Export failed", error)
      toast.error(i18n.t("download.toast.exportFailed"))
    }
    finally {
      setDownloadingId(null)
    }
  }

  return (
    <PageLayout
      title={i18n.t("download.title")}
    >
      <div className="flex flex-col gap-6">
        <StatGrid>
          <StatCard label={i18n.t("download.stats.cached")} value={books.length} />
          <StatCard label={i18n.t("download.stats.storage")} value={isLoading ? i18n.t("download.stats.ellipsis") : storageUsed} />
        </StatGrid>

        <div className="flex flex-col gap-4">
          <h2 className="text-base font-semibold">{i18n.t("download.section.exportable")}</h2>

          {books.length > 0
            ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {books.map(book => (
                    <MiniCard
                      key={book.id}
                      className="flex items-center justify-between gap-3 hover:border-primary/50 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <h3
                          className="font-medium text-sm truncate"
                          title={book.title}
                        >
                          {book.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {book.author || i18n.t("common.unknown")}
                          {" "}
                          •
                          {book.totalChapters}
                          {" "}
                          {i18n.t("download.unit.chapter")}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="shrink-0 h-8 text-xs"
                            disabled={downloadingId === book.id}
                          >
                            {downloadingId === book.id ? i18n.t("download.actions.exporting") : i18n.t("download.actions.export")}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownloadBook(book, "epub")}>
                            <Download />
                            EPUB
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadBook(book, "txt")}>
                            <FileText />
                            TXT
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </MiniCard>
                  ))}
                </div>
              )
            : (
                <EmptyState
                  title={i18n.t("download.empty.exportable.title")}
                  description={i18n.t("download.empty.exportable.desc")}
                />
              )}
        </div>
      </div>
    </PageLayout>
  )
}
