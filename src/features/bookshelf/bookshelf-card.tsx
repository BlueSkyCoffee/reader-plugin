import type { Book } from "@/types/novel"
import { BookOpen, Download, Play, Trash2 } from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useReaderNavigation } from "@/features/reader"
import { cn } from "@/utils/cn"

interface BookCardProps {
  book: Book
  isActive: boolean
  layout?: "grid" | "list"
  onSelect: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onDownload: (book: Book) => void
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isActive,
  layout = "grid",
  onSelect,
  onDelete,
  onDownload,
}) => {
  const { continueReading } = useReaderNavigation()
  const progress = ((book.progress?.chapterIndex || 0) / (book.totalChapters || 1) * 100).toFixed(0)

  const handleContinueReading = (e: React.MouseEvent) => {
    e.stopPropagation()
    void continueReading(book.id)
  }

  const handleDownloadClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onDownload(book)
  }

  if (layout === "list") {
    return (
      <Card
        onClick={() => onSelect(book.id)}
        className={cn(
          "group cursor-pointer transition-all hover:bg-muted/40",
          isActive
            ? "border-primary bg-primary/10 ring-1 ring-primary"
            : "border-border",
        )}
      >
        <CardContent className="flex items-center gap-3 p-3 sm:gap-4">
          <div className="relative flex h-24 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted shadow-sm sm:h-28 sm:w-20">
            {book.cover
              ? (
                  <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
                )
              : (
                  <BookOpen className="size-7 text-muted-foreground/50" />
                )}
            {isActive && (
              <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                <BookOpen className="size-8 text-primary" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-1">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground sm:text-base" title={book.title}>
                  {book.title}
                </h3>
                {isActive && (
                  <Badge variant="secondary">当前</Badge>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {book.author || "未知作者"}
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                <span>
                  {book.totalChapters}
                  {" "}
                  章节
                </span>
                <Badge variant="secondary">
                  {progress}
                  %
                </Badge>
                {book.sourceName && (
                  <Badge variant="outline">{book.sourceName}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            <Button
              onClick={handleContinueReading}
              size="icon-sm"
              variant="ghost"
              title="继续阅读"
            >
              <Play className="size-4" />
            </Button>
            <Button
              onClick={handleDownloadClick}
              size="icon-sm"
              variant="ghost"
              title="导出 EPUB"
            >
              <Download className="size-4" />
            </Button>
            <Button
              onClick={e => onDelete(book.id, e)}
              size="icon-sm"
              variant="ghost"
              title="删除书籍"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={() => onSelect(book.id)}
      className={cn(
        "group cursor-pointer overflow-hidden transition-all hover:bg-muted/40",
        isActive
          ? "border-primary bg-primary/10 ring-1 ring-primary"
          : "border-border",
      )}
    >
      <CardContent className="flex h-full flex-col p-3">
        <div className="relative mx-auto aspect-[5/7] w-full max-w-32 overflow-hidden rounded-md bg-muted shadow-sm">
          {book.cover
            ? (
                <img src={book.cover} alt={book.title} className="h-full w-full object-cover" />
              )
            : (
                <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-xs text-muted-foreground">
                  <BookOpen className="size-8 text-muted-foreground/50" />
                  <span>暂无封面</span>
                </div>
              )}
          {isActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
              <BookOpen className="size-10 text-primary" />
            </div>
          )}
        </div>

        <div className="mt-3 min-w-0 text-center">
          <h3 className="line-clamp-1 text-sm font-semibold text-foreground" title={book.title}>
            {book.title}
          </h3>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {book.author || "未知作者"}
          </p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              {book.totalChapters}
              {" "}
              章节
            </Badge>
            <Badge variant="secondary">
              {progress}
              %
            </Badge>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Button
            onClick={handleContinueReading}
            size="icon-sm"
            variant="ghost"
            title="继续阅读"
          >
            <Play className="size-4" />
          </Button>
          <Button
            onClick={handleDownloadClick}
            size="icon-sm"
            variant="ghost"
            title="导出 EPUB"
          >
            <Download className="size-4" />
          </Button>
          <Button
            onClick={e => onDelete(book.id, e)}
            size="icon-sm"
            variant="ghost"
            title="删除书籍"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
