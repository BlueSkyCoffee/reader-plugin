import { browser } from "wxt/browser"
import type { Book } from "@/types/novel"
import { Grid2X2, List, Loader2, Plus } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { SearchInput } from "@/components/app/search-input"
import { PageLayout } from "@/components/app/page-layout"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookCard } from "@/features/bookshelf/bookshelf-card"
import { useBookshelf } from "@/features/bookshelf/use-bookshelf"
import { EpubGenerator } from "@/lib/epub-generator"
import { EpubService } from "@/lib/epub-service"
import { StorageManager } from "@/lib/storage"
import { TxtGenerator } from "@/lib/txt-generator"
import { cn } from "@/utils"
import { confirmAction } from "@/utils/browser-dialog"

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
      toast.success(browser.i18n.getMessage("bookshelf_toast_switchSuccess"))
    }
    catch {
      toast.error(browser.i18n.getMessage("bookshelf_toast_switchFailed"))
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!await confirmAction(browser.i18n.getMessage("bookshelf_confirm_deleteBook"))) {
      return
    }

    try {
      await StorageManager.deleteBook(id)
      refresh()
      toast.success(browser.i18n.getMessage("bookshelf_toast_deleteSuccess"))
    }
    catch {
      toast.error(browser.i18n.getMessage("bookshelf_toast_deleteFailed"))
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
      toast.success(browser.i18n.getMessage("bookshelf_toast_exportSuccess"))
    }
    catch {
      toast.error(browser.i18n.getMessage("bookshelf_toast_exportFailed"))
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
      toast.success(browser.i18n.getMessage("bookshelf_toast_importSuccess"))
    }
    catch (error: unknown) {
      const message = error instanceof Error ? error.message : browser.i18n.getMessage("common_unknownError")
      toast.error(browser.i18n.getMessage("bookshelf_toast_importFailed", [message]))
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

  const filteredBooks = books.filter(
    b =>
      b.title.toLowerCase().includes(searchQuery.toLowerCase())
      || b.author?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <PageLayout
      title={browser.i18n.getMessage("bookshelf_title")}
      description={browser.i18n.getMessage("bookshelf_description", [String(books.length)])}
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
          {browser.i18n.getMessage("bookshelf_actions_importOffline")}
        </Button>
      )}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <SearchInput
              placeholder={browser.i18n.getMessage("bookshelf_search_placeholder")}
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
              <div className={cn(
                layout === "grid"
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                  : "flex flex-col gap-3",
              )}
              >
                {Array.from({ length: 8 }).map((_, i) => (
                  layout === "grid"
                    ? (
                        <div key={i} className="flex flex-col gap-2">
                          <Skeleton className="aspect-[3/4] w-full rounded-lg" />
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      )
                    : (
                        <div key={i} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
                          <Skeleton className="size-10 shrink-0 rounded-md" />
                          <div className="flex-1 flex flex-col gap-1.5">
                            <Skeleton className="h-3.5 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                          </div>
                        </div>
                      )
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
