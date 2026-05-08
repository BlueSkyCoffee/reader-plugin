import type { Book } from "@/types/novel"
import { i18n } from "#imports"
import { BookOpen, Download, MoreVertical, Play, Trash2 } from "lucide-react"
import * as React from "react"
import { NovelCardBase } from "@/components/app/novel-card-base"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useReaderNavigation } from "@/features/reader"

interface BookCardProps {
  book: Book
  isActive: boolean
  layout?: "grid" | "list"
  onSelect: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onDownload: (book: Book) => void
}

function BookCardActions({
  onContinue,
  onDownload,
  onDelete,
}: {
  onContinue: (e: React.MouseEvent) => void
  onDownload: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={e => e.stopPropagation()}>
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{i18n.t("common_actions")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={onContinue}>
          <Play className="size-4" />
          {i18n.t("bookcard_continueReading")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownload}>
          <Download className="size-4" />
          {i18n.t("bookcard_exportEpub")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="size-4" />
          {i18n.t("bookcard_deleteBook")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function ProgressBadge({ book }: { book: Book }) {
  const total = book.totalChapters || 0
  const current = book.progress?.chapterIndex || 0
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <Badge variant="secondary" className="text-[10px]">
      {percent}
      %
    </Badge>
  )
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

  const handleContinueReading = (e: React.MouseEvent) => {
    e.stopPropagation()
    void continueReading(book.id)
  }

  const handleDownloadClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onDownload(book)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(book.id, e)
  }

  const header = (
    <div>
      <h3 className="line-clamp-1 text-sm font-semibold" title={book.title}>
        {book.title}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {book.author || i18n.t("common_unknown")}
      </p>
    </div>
  )

  const meta = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className="text-[10px]">
        {book.totalChapters}
        {" "}
        {i18n.t("bookcard_chapters")}
      </Badge>
      <ProgressBadge book={book} />
      {isActive && (
        <Badge variant="secondary" className="text-[10px]">{i18n.t("bookcard_active")}</Badge>
      )}
      {book.sourceName && (
        <Badge variant="outline" className="text-[10px]">{book.sourceName}</Badge>
      )}
    </div>
  )

  const actions = (
    <BookCardActions
      onContinue={handleContinueReading}
      onDownload={handleDownloadClick}
      onDelete={handleDeleteClick}
    />
  )

  const cover = {
    src: book.cover,
    alt: book.title,
    fallback: (
      <div className="flex flex-col items-center gap-1.5 px-2 text-center">
        <BookOpen className="size-7 text-muted-foreground/40" />
        <span className="text-[10px] text-muted-foreground/60">{i18n.t("bookcard_noCover")}</span>
      </div>
    ),
  }

  return (
    <NovelCardBase
      layout={layout}
      cover={cover}
      header={header}
      meta={meta}
      actions={actions}
      actionsOverlay={actions}
      activeIndicator={isActive}
      onClick={() => onSelect(book.id)}
    />
  )
}
