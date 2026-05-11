import { browser } from "wxt/browser"
import type { Book } from "@/types/novel"
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
import { useReaderNavigation } from "@/hooks/use-reader-navigation"

interface BookCardProps {
  book: Book
  isActive: boolean
  layout?: "grid" | "list"
  onSelect: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onDownload: (book: Book, format?: "epub" | "txt") => void
}

function BookCardActions({
  onContinue,
  onDownloadEpub,
  onDownloadTxt,
  onDelete,
}: {
  onContinue: (e: React.MouseEvent) => void
  onDownloadEpub: (e: React.MouseEvent) => void
  onDownloadTxt: (e: React.MouseEvent) => void
  onDelete: (e: React.MouseEvent) => void
}) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={e => e.stopPropagation()}>
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{browser.i18n.getMessage("common_actions")}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" onClick={e => e.stopPropagation()}>
        <DropdownMenuItem onClick={onContinue}>
          <Play />
          {browser.i18n.getMessage("bookcard_continueReading")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownloadEpub}>
          <Download />
          {browser.i18n.getMessage("bookcard_exportEpub")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDownloadTxt}>
          <Download />
          {browser.i18n.getMessage("bookcard_exportTxt")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 />
          {browser.i18n.getMessage("bookcard_deleteBook")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isActive,
  layout = "list",
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
    onDownload(book, "epub")
  }

  const handleDownloadTxtClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    onDownload(book, "txt")
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(book.id, e)
  }

  const total = book.totalChapters || 0
  const current = book.progress?.chapterIndex || 0
  const percent = total > 0 ? Math.round((current / total) * 100) : 0

  // 列表模式：紧凑横向，与 popup 风格一致
  const listHeader = (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium truncate flex-1" title={book.title}>
        {book.title}
      </span>
      {isActive && (
        <Badge variant="secondary" className="text-[9px] shrink-0 px-1 py-0">
          {browser.i18n.getMessage("bookcard_active")}
        </Badge>
      )}
    </div>
  )

  const listMeta = (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground truncate">
        {book.author || browser.i18n.getMessage("common_unknown")}
      </span>
      <span className="text-[10px] text-muted-foreground/60 shrink-0">
        {total}
        {browser.i18n.getMessage("bookcard_chapters")}
      </span>
      {total > 0 && (
        <Badge variant="outline" className="text-[9px] shrink-0 px-1 py-0">
          {percent}
          %
        </Badge>
      )}
    </div>
  )

  // 网格模式：大封面卡片
  const gridHeader = (
    <div>
      <h3 className="line-clamp-1 text-sm font-semibold" title={book.title}>
        {book.title}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {book.author || browser.i18n.getMessage("common_unknown")}
      </p>
    </div>
  )

  const gridMeta = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="outline" className="text-[10px]">
        {book.totalChapters}
        {" "}
        {browser.i18n.getMessage("bookcard_chapters")}
      </Badge>
      {total > 0 && (
        <Badge variant="secondary" className="text-[10px]">
          {percent}
          %
        </Badge>
      )}
      {book.sourceName && (
        <Badge variant="outline" className="text-[10px]">{book.sourceName}</Badge>
      )}
    </div>
  )

  // 列表模式：内联图标按钮，与搜索页风格一致
  const listActions = (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon-sm" variant="ghost" onClick={handleContinueReading}>
            <Play />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{browser.i18n.getMessage("bookcard_continueReading")}</TooltipContent>
      </Tooltip>
      <BookCardActions
        onContinue={handleContinueReading}
        onDownloadEpub={handleDownloadClick}
        onDownloadTxt={handleDownloadTxtClick}
        onDelete={handleDeleteClick}
      />
    </div>
  )

  // 网格模式：DropdownMenu
  const gridActions = (
    <BookCardActions
      onContinue={handleContinueReading}
      onDownloadEpub={handleDownloadClick}
      onDownloadTxt={handleDownloadTxtClick}
      onDelete={handleDeleteClick}
    />
  )

  const cover = {
    src: book.cover,
    alt: book.title,
    fallback: layout === "grid"
      ? (
          <div className="flex flex-col items-center gap-1.5 px-2 text-center">
            <BookOpen className="size-7 text-muted-foreground/40" />
            <span className="text-[10px] text-muted-foreground/60">{browser.i18n.getMessage("bookcard_noCover")}</span>
          </div>
        )
      : undefined,
  }

  return (
    <NovelCardBase
      layout={layout}
      cover={cover}
      header={layout === "list" ? listHeader : gridHeader}
      meta={layout === "list" ? listMeta : gridMeta}
      actions={layout === "list" ? listActions : gridActions}
      actionsOverlay={layout === "grid" ? gridActions : undefined}
      activeIndicator={isActive}
      onClick={() => onSelect(book.id)}
    />
  )
}
