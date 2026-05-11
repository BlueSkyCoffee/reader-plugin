import { browser } from "wxt/browser"
import type { SearchResult } from "@/types/novel"
import { BookOpen, Download, ExternalLink, Loader2 } from "lucide-react"
import * as React from "react"
import { NovelCardBase } from "@/components/app/novel-card-base"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface SearchResultCardProps {
  result: SearchResult
  sourceName: string
  layout?: "grid" | "list"
  onAddToShelf: (result: SearchResult) => Promise<void>
  onDownload: (result: SearchResult) => Promise<void>
  isDownloading: boolean
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  sourceName,
  layout = "list",
  onAddToShelf,
  onDownload,
  isDownloading,
}) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const isBusy = isLoading || isDownloading

  const handleAddToShelf = async () => {
    setIsLoading(true)
    try {
      await onAddToShelf(result)
    }
    finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      await onDownload(result)
    }
    finally {
      setIsLoading(false)
    }
  }

  // 列表模式：紧凑横向，与 popup 风格一致
  const listHeader = (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium truncate flex-1" title={result.bookName}>
        {result.bookName}
      </span>
      <Badge variant="secondary" className="text-[9px] shrink-0 px-1 py-0 max-w-20 truncate">
        {sourceName}
      </Badge>
    </div>
  )

  const listMeta = (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] text-muted-foreground truncate">
        {result.author || browser.i18n.getMessage("common_anonymous")}
      </span>
      {result.latestChapter && (
        <span className="text-[10px] text-muted-foreground/60 truncate shrink-0 max-w-32" title={result.latestChapter}>
          {result.latestChapter}
        </span>
      )}
    </div>
  )

  const listActions = (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              void handleAddToShelf()
            }}
            disabled={isBusy}
          >
            {isLoading
              ? <Loader2 className="size-4 animate-spin" />
              : <BookOpen />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{browser.i18n.getMessage("search_actions_addToShelf")}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              void handleDownload()
            }}
            disabled={isBusy}
          >
            {isDownloading
              ? <Loader2 className="size-4 animate-spin" />
              : <Download />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>EPUB</TooltipContent>
      </Tooltip>
    </div>
  )

  // 网格模式：大封面卡片
  const gridHeader = (
    <div>
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug" title={result.bookName}>
        {result.bookName}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {result.author || browser.i18n.getMessage("common_anonymous")}
      </p>
    </div>
  )

  const tags = [result.category, result.status, result.wordCount].filter(Boolean) as string[]

  const gridMeta = (
    <div className="flex flex-col gap-1.5">
      {result.latestChapter && (
        <p className="line-clamp-1 text-[11px] text-muted-foreground" title={result.latestChapter}>
          <span className="text-muted-foreground/70">{browser.i18n.getMessage("search_result_latest")}</span>
          {result.latestChapter}
        </p>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map(tag => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )

  const gridBadges = (
    <Badge variant="secondary" className="max-w-24 truncate text-[10px]">
      {sourceName}
    </Badge>
  )

  const gridActions = (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="default"
        className="flex-1"
        onClick={(e) => {
          e.stopPropagation()
          void handleAddToShelf()
        }}
        disabled={isBusy}
      >
        {isLoading
          ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          : <BookOpen data-icon="inline-start" />}
        {browser.i18n.getMessage("search_actions_addToShelf")}
      </Button>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon-sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              void handleDownload()
            }}
            disabled={isBusy}
          >
            {isDownloading
              ? <Loader2 className="size-4 animate-spin" />
              : <Download />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>EPUB</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={result.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
              <ExternalLink />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{browser.i18n.getMessage("search_actions_sourceSite")}</TooltipContent>
      </Tooltip>
    </div>
  )

  return (
    <NovelCardBase
      layout={layout}
      cover={{ src: result.coverUrl, alt: result.bookName }}
      badges={layout === "grid" ? gridBadges : undefined}
      header={layout === "list" ? listHeader : gridHeader}
      meta={layout === "list" ? listMeta : gridMeta}
      actions={layout === "list" ? listActions : gridActions}
      actionsOverlay={layout === "grid" ? listActions : undefined}
    />
  )
}
