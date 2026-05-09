import type { SearchResult } from "@/types/novel"
import { i18n } from "#imports"
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
  layout = "grid",
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

  const metaItems = [
    result.latestChapter && {
      label: i18n.t("search_result_latest"),
      value: result.latestChapter,
    },
    result.lastUpdateTime && {
      label: i18n.t("search_result_updated"),
      value: result.lastUpdateTime,
    },
  ].filter(Boolean) as Array<{ label: string, value: string }>

  const tags = [result.category, result.status, result.wordCount].filter(Boolean) as string[]

  const header = (
    <div>
      <h3 className="line-clamp-2 text-sm font-semibold leading-snug" title={result.bookName}>
        {result.bookName}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
        {result.author || i18n.t("common_anonymous")}
      </p>
    </div>
  )

  const meta = (
    <div className="flex flex-col gap-1.5">
      {metaItems.map(item => (
        <p key={item.label} className="line-clamp-1 text-[11px] text-muted-foreground" title={item.value}>
          <span className="text-muted-foreground/70">{item.label}</span>
          {item.value}
        </p>
      ))}
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

  const badges = (
    <Badge variant="secondary" className="max-w-24 truncate text-[10px]">
      {sourceName}
    </Badge>
  )

  if (layout === "list") {
    const actions = (
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="default"
              onClick={(e) => {
                e.stopPropagation()
                void handleAddToShelf()
              }}
              disabled={isBusy}
            >
              {isLoading
                ? <Loader2 className="size-4 animate-spin" />
                : <BookOpen className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{i18n.t("search_actions_addToShelf")}</TooltipContent>
        </Tooltip>
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
                : <Download className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>EPUB</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" asChild>
              <a href={result.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{i18n.t("search_actions_sourceSite")}</TooltipContent>
        </Tooltip>
      </div>
    )

    return (
      <NovelCardBase
        layout="list"
        header={header}
        meta={meta}
        badges={badges}
        actions={actions}
      />
    )
  }

  const actions = (
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
          : <BookOpen className="size-4" data-icon="inline-start" />}
        {i18n.t("search_actions_addToShelf")}
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
              : <Download className="size-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>EPUB</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon-sm" asChild>
            <a href={result.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>
              <ExternalLink className="size-4" />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{i18n.t("search_actions_sourceSite")}</TooltipContent>
      </Tooltip>
    </div>
  )

  return (
    <NovelCardBase
      layout="grid"
      cover={{ src: result.coverUrl, alt: result.bookName }}
      badges={badges}
      header={header}
      meta={meta}
      actions={actions}
    />
  )
}
