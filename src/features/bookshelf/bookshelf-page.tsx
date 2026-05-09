import type { Book } from "@/types/novel"
import { i18n } from "#imports"
import { Grid2X2, List, Loader2, Plus } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { SearchInput } from "@/components/app/search-input"
import { PageLayout } from "@/components/layout/page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookCard, useBookshelf } from "@/features/bookshelf"
import { EpubGenerator } from "@/lib/epub-generator"
import { EpubService } from "@/lib/epub-service"
import { StorageManager } from "@/lib/storage"
import { TxtGenerator } from "@/lib/txt-generator"
import { confirmAction } from "@/utils/browser-dialog"
import { cn } from "@/utils/cn"

type BookshelfLayout = "grid" | "list"
const BOOKSHELF_LAYOUT_STORAGE_KEY = "bookshelf-layout"

function getInitialLayout(): BookshelfLayout {
  if (typeof window === "undefined") {
    return "list"
  }

  try {
    const savedLayout = window.localStorage.getItem(BOOKSHELF_LAYOUT_STORAGE_KEY)
    return savedLayout === "grid" ? "grid" : "list"
  }
  catch {
    return "list"
  }
}

export function BookshelfPage() {
  const { books, activeBookId, isLoading, refresh } = useBookshelf()
  const [searchQuery, setSearchQuery] = useState("")
  const [layout, setLayout] = useState<BookshelfLayout>(getInitialLayout)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleLayoutChange = (nextLayout: BookshelfLayout) => {
    setLayout(nextLayout)
    try {
      window.localStorage.setItem(BOOKSHELF_LAYOUT_STORAGE_KEY, nextLayout)
    }
    catch {
      // Layout persistence is optional.
    }
  }

  const handleSelect = async (id: string) => {
    try {
      await StorageManager.switchBook(id)
      refresh()
      toast.success(i18n.t("bookshelf.toast.switchSuccess"))
    }
    catch {
      toast.error(i18n.t("bookshelf.toast.switchFailed"))
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!await confirmAction(i18n.t("bookshelf.confirm.deleteBook"))) {
      return
    }

    try {
      await StorageManager.deleteBook(id)
      refresh()
      toast.success(i18n.t("bookshelf.toast.deleteSuccess"))
    }
    catch {
      toast.error(i18n.t("bookshelf.toast.deleteFailed"))
    }
  }

  const handleDownload = async (book: Book, format: "epub" | "txt" = "epub") => {
    try {
      const chapters = await StorageManager.getBookChapters(book.id)
      if (format === "txt") {
        const generator = new TxtGenerator(book, chapters)
        await generator.generateAndDownload()
      }
      else {
        const generator = new EpubGenerator(book, chapters)
        await generator.generateAndDownload()
      }
      toast.success(i18n.t("bookshelf.toast.exportSuccess"))
    }
    catch {
      toast.error(i18n.t("bookshelf.toast.exportFailed"))
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file)
      return
    setIsImporting(true)
    try {
      const { book, chapters } = await EpubService.parseEpub(file)
      await StorageManager.saveBook(book, chapters)
      refresh()
      toast.success(i18n.t("bookshelf.toast.importSuccess"))
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : i18n.t("common.unknownError")
      toast.error(i18n.t("bookshelf.toast.importFailed", [message]))
    }
    finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleImportKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleImportClick()
    }
  }

  const filteredBooks = books.filter(
    b =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase())
      || b.author?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <PageLayout
      title={i18n.t("bookshelf.title")}
      description={i18n.t("bookshelf.description", [books.length])}
      action={(
        <Button
          onClick={handleImportClick}
          disabled={isImporting}
          className="gap-2"
        >
          {isImporting
            ? (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              )
            : (
                <Plus className="size-4" data-icon="inline-start" />
              )}
          {i18n.t("bookshelf.actions.importOffline")}
        </Button>
      )}
    >
      <div className="flex flex-col gap-6">
        <div
          role="button"
          tabIndex={0}
          onClick={handleImportClick}
          onKeyDown={handleImportKeyDown}
          className="group relative overflow-hidden rounded-lg border border-dashed border-border bg-card/60 px-5 py-4 transition hover:border-primary/60 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-foreground">
                {i18n.t("bookshelf.import.title")}
              </p>
              <p className="text-xs text-muted-foreground">
                {i18n.t("bookshelf.import.desc")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">.epub</Badge>
              <Button size="sm" variant="outline" className="gap-2">
                <Plus className="size-4" data-icon="inline-start" />
                {i18n.t("bookshelf.import.chooseFile")}
              </Button>
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 transition group-hover:opacity-100" />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              placeholder={i18n.t("bookshelf.search.placeholder")}
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
          <Tabs
            value={layout}
            onValueChange={value => handleLayoutChange(value as BookshelfLayout)}
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

        {isLoading
          ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            )
          : filteredBooks.length > 0
            ? (
                <div
                  className={cn(
                    layout === "grid"
                      ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                      : "flex flex-col gap-3",
                  )}
                >
                  {filteredBooks.map(book => (
                    <BookCard
                      key={book.id}
                      book={book}
                      isActive={book.id === activeBookId}
                      layout={layout}
                      onSelect={handleSelect}
                      onDelete={handleDelete}
                      onDownload={handleDownload}
                    />
                  ))}
                </div>
              )
            : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".epub"
        onChange={handleImport}
        className="hidden"
      />
    </PageLayout>
  )
}
