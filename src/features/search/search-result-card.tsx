import type { SearchResult } from "@/types/novel"
import { BookOpen, Download, ExternalLink, Loader2 } from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { i18n } from "@/i18n"

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
      label: i18n.t("search.result.latest"),
      value: result.latestChapter,
    },
    result.lastUpdateTime && {
      label: i18n.t("search.result.updated"),
      value: result.lastUpdateTime,
    },
  ].filter(Boolean) as Array<{ label: string, value: string }>

  const tags = [result.category, result.status, result.wordCount].filter(Boolean) as string[]

  if (layout === "list") {
    return (
      <Card className="group transition-all hover:bg-muted/40">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <BookOpen className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 flex-1 truncate text-sm font-semibold" title={result.bookName}>
                  {result.bookName}
                </h3>
                <Badge variant="secondary">{sourceName}</Badge>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {result.author || i18n.t("common.anonymous")}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px]">
                    {tag}
                  </Badge>
                ))}
              </div>
              {metaItems.length > 0 && (
                <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-3">
                  {metaItems.map(item => (
                    <span key={item.label} className="truncate">
                      <span className="text-muted-foreground/70">{item.label}</span>
                      {item.value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:justify-end">
            <Button
              size="sm"
              variant="default"
              onClick={handleAddToShelf}
              disabled={isBusy}
            >
              {isLoading
                ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                : <BookOpen className="size-4" data-icon="inline-start" />}
              {i18n.t("search.actions.addToShelf")}
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              onClick={handleDownload}
              disabled={isBusy}
              title="EPUB"
            >
              {isBusy
                ? <Loader2 className="size-4 animate-spin" />
                : <Download className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              asChild
              title={i18n.t("search.actions.sourceSite")}
            >
              <a href={result.url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="group flex h-full flex-col overflow-hidden transition-all hover:bg-muted/40">
      <CardHeader className="gap-3 p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <BookOpen className="size-5" />
          </div>
          <Badge variant="secondary" className="max-w-24 truncate">
            {sourceName}
          </Badge>
        </div>
        <div>
          <CardTitle className="line-clamp-2 text-sm leading-snug" title={result.bookName}>
            {result.bookName}
          </CardTitle>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {result.author || i18n.t("common.anonymous")}
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-4 pt-2">
        <div className="flex flex-col gap-2">
          {metaItems.map(item => (
            <p key={item.label} className="line-clamp-1 text-xs text-muted-foreground" title={item.value}>
              <span className="text-muted-foreground/70">
                {item.label}
              </span>
              {item.value}
            </p>
          ))}

          <div className="flex flex-wrap gap-1.5">
            {tags.map(tag => (
              <Badge key={tag} variant="outline" className="text-[10px]">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-[1fr_auto_auto] gap-2 p-4 pt-0">
        <Button
          size="sm"
          variant="default"
          onClick={handleAddToShelf}
          disabled={isBusy}
        >
          {isLoading
            ? <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            : <BookOpen className="size-4" data-icon="inline-start" />}
          {i18n.t("search.actions.addToShelf")}
        </Button>
        <Button
          size="icon-sm"
          variant="outline"
          onClick={handleDownload}
          disabled={isBusy}
          title="EPUB"
        >
          {isBusy
            ? <Loader2 className="size-4 animate-spin" />
            : <Download className="size-4" />}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
          title={i18n.t("search.actions.sourceSite")}
        >
          <a href={result.url} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}
