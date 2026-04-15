import type { Book, DownloadRecord } from "@/types/novel"
import { Download, Info, Trash, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { EmptyState } from "@/shared/components/app/empty-state"
import { MiniCard } from "@/shared/components/app/mini-card"
import { StatCard, StatGrid } from "@/shared/components/app/stat-card"
import { PageLayout } from "@/shared/components/layout/page-layout"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { ScrollArea } from "@/shared/components/ui/scroll-area"
import { i18n } from "@/shared/i18n"
import { StorageManager } from "@/shared/infra/storage"
import { EpubGenerator } from "@/shared/services/epub-generator"
import { confirmAction } from "@/shared/utils/browser-dialog"

export function DownloadPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [downloadRecords, setDownloadRecords] = useState<DownloadRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [storageUsed, setStorageUsed] = useState<string>(i18n.t("download.stats.calculating"))
  const [downloadStats, setDownloadStats] = useState({
    totalRecords: 0,
    totalSize: 0,
    formatBreakdown: { html: 0, epub: 0, txt: 0 },
    recentCount: 0,
  })

  const loadData = async () => {
    try {
      setIsLoading(true)
      const [bookshelf, records, stats] = await Promise.all([
        StorageManager.getBookshelf(),
        StorageManager.getDownloadRecords(),
        StorageManager.getDownloadStats(),
      ])

      setBooks(bookshelf)
      setDownloadRecords(records)
      setDownloadStats(stats)

      const info = await StorageManager.getStorageInfo()
      setStorageUsed(info.estimatedSize)
    }
    catch (error) {
      console.error("Load data error:", error)
      toast.error(i18n.t("download.toast.loadFailed"))
    }
    finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleDownloadBook = async (book: Book) => {
    setDownloadingId(book.id)
    try {
      const chapters = await StorageManager.getBookChapters(book.id)

      if (!chapters || chapters.length === 0) {
        toast.error(i18n.t("download.toast.emptyBook"))
        return
      }

      const generator = new EpubGenerator(book, chapters)
      await generator.generateAndDownload()

      await StorageManager.addDownloadRecord({
        id: crypto.randomUUID(),
        bookId: book.id,
        title: book.title,
        author: book.author,
        format: "epub",
        fileSize: 0, // In browser, we don't have exact file size easily sync
        downloadedAt: Date.now(),
        fileName: `${book.title}.epub`,
        chapterCount: chapters.length,
        status: "success",
      })

      const records = await StorageManager.getDownloadRecords()
      const stats = await StorageManager.getDownloadStats()
      setDownloadRecords(records)
      setDownloadStats(stats)

      toast.success(i18n.t("download.toast.exportSuccess", { title: book.title }))
    }
    catch (error) {
      console.error("Download error:", error)
      toast.error(i18n.t("download.toast.exportFailed"))
    }
    finally {
      setDownloadingId(null)
    }
  }

  const handleDeleteRecord = async (recordId: string, recordTitle: string) => {
    if (!await confirmAction(i18n.t("download.confirm.deleteRecord", { title: recordTitle }))) {
      return
    }

    try {
      await StorageManager.deleteDownloadRecord(recordId)
      const records = await StorageManager.getDownloadRecords()
      const stats = await StorageManager.getDownloadStats()
      setDownloadRecords(records)
      setDownloadStats(stats)

      toast.success(i18n.t("download.toast.recordDeleted"))
    }
    catch (error) {
      console.error("Delete record error:", error)
      toast.error(i18n.t("download.toast.deleteFailed"))
    }
  }

  const handleClearAllRecords = async () => {
    if (!await confirmAction(i18n.t("download.confirm.clearAll"))) {
      return
    }

    try {
      await StorageManager.clearDownloadRecords()
      setDownloadRecords([])
      setDownloadStats({
        totalRecords: 0,
        totalSize: 0,
        formatBreakdown: { html: 0, epub: 0, txt: 0 },
        recentCount: 0,
      })

      toast.success(i18n.t("download.toast.cleared"))
    }
    catch (error) {
      console.error("Clear records error:", error)
      toast.error(i18n.t("download.toast.clearFailed"))
    }
  }

  return (
    <PageLayout
      title={i18n.t("download.title")}
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        <StatGrid>
          <StatCard label={i18n.t("download.stats.cached")} value={books.length} />
          <StatCard label={i18n.t("download.stats.totalRecords")} value={downloadStats.totalRecords} />
          <StatCard
            label={i18n.t("download.stats.recent")}
            value={downloadStats.recentCount}
            valueClassName="text-emerald-600"
          />
          <StatCard label={i18n.t("download.stats.storage")} value={isLoading ? i18n.t("download.stats.ellipsis") : storageUsed} />
        </StatGrid>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Books To Download List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-base font-semibold">{i18n.t("download.section.exportable")}</h2>

            {books.length > 0
              ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <Button
                          variant="ghost"
                          size="sm"
                          className="shrink-0 h-8 text-xs"
                          onClick={() => handleDownloadBook(book)}
                          disabled={downloadingId === book.id}
                        >
                          {downloadingId === book.id ? i18n.t("download.actions.exporting") : i18n.t("download.actions.export")}
                        </Button>
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

          {/* Download Records Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{i18n.t("download.section.recent")}</h2>
              {downloadStats.totalRecords > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAllRecords}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash className="w-3 h-3 mr-1" />
                  {i18n.t("download.actions.clear")}
                </Button>
              )}
            </div>

            {downloadRecords.length > 0
              ? (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2 pr-4">
                      {downloadRecords.slice(0, 50).map(record => (
                        <MiniCard
                          key={record.id}
                          className="flex items-start gap-2 hover:border-primary/50 transition-all group"
                        >
                          <div className="p-1.5 bg-muted rounded text-muted-foreground flex-shrink-0">
                            <Download className="w-3 h-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3
                                className="font-medium text-xs truncate"
                                title={record.title}
                              >
                                {record.title}
                              </h3>
                              <Badge
                                variant="secondary"
                                className="text-[9px] shrink-0 px-1.5 py-0"
                              >
                                {record.format.toUpperCase()}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center justify-between">
                              <span>
                                {new Date(record.downloadedAt).toLocaleDateString()}
                              </span>
                              <button
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/60 hover:text-destructive"
                                onClick={() =>
                                  handleDeleteRecord(record.id, record.title)}
                                title={i18n.t("download.actions.deleteRecord")}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </MiniCard>
                      ))}
                    </div>
                  </ScrollArea>
                )
              : (
                  <EmptyState
                    icon={<Info className="w-4 h-4" />}
                    title={i18n.t("download.empty.records.title")}
                    description={i18n.t("download.empty.records.desc")}
                    className="border-0 bg-transparent"
                  />
                )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
