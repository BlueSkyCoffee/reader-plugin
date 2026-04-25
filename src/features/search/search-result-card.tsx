import type { SearchResult } from "@/types/novel"
import { BookOpen, Download, ExternalLink, Loader2 } from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { i18n } from "@/i18n"

interface SearchResultCardProps {
  result: SearchResult
  sourceName: string
  onAddToShelf: (result: SearchResult) => Promise<void>
  onDownload: (result: SearchResult) => Promise<void>
  isDownloading: boolean
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  sourceName,
  onAddToShelf,
  onDownload,
  isDownloading,
}) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [coverUrl, setCoverUrl] = React.useState<string | null>(null)
  const [isHovered, setIsHovered] = React.useState(false)

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

  return (
    <Card
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Section */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gradient-to-br from-muted/80 to-muted">
        {coverUrl
          ? (
              <img
                src={coverUrl}
                alt={result.bookName}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setCoverUrl(null)}
              />
            )
          : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <BookOpen className="h-12 w-12 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground/60">
                  {i18n.t("search.card.noCover")}
                </span>
              </div>
            )}

        {/* Source Badge Overlay */}
        <div className="absolute top-3 right-3 z-10">
          <Badge
            variant="secondary"
            className="bg-background/90 backdrop-blur-sm text-xs shadow-sm"
          >
            {sourceName}
          </Badge>
        </div>

        {/* Hover Actions Overlay */}
        <div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center gap-2 bg-gradient-to-t from-background/95 via-background/60 to-transparent transition-opacity duration-200",
            isHovered && !isLoading ? "opacity-100" : "opacity-0",
          )}
        >
          <Button
            size="sm"
            variant="default"
            className="h-8 gap-1.5 shadow-md"
            onClick={handleAddToShelf}
            disabled={isLoading}
          >
            <BookOpen className="h-3.5 w-3.5" />
            {i18n.t("search.actions.addToShelf")}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 gap-1.5 shadow-md"
            onClick={handleDownload}
            disabled={isLoading || isDownloading}
          >
            {isLoading || isDownloading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Download className="h-3.5 w-3.5" />}
            EPUB
          </Button>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Book Info Section */}
      <CardContent className="p-4">
        <div className="flex flex-col gap-2">
          <h3
            className="font-semibold text-sm line-clamp-2 leading-snug"
            title={result.bookName}
          >
            {result.bookName}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {result.author || i18n.t("common.anonymous")}
          </p>

          {/* Meta Info */}
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            {result.latestChapter && (
              <p className="line-clamp-1" title={result.latestChapter}>
                <span className="text-muted-foreground/70">
                  {i18n.t("search.result.latest")}
                </span>
                {result.latestChapter}
              </p>
            )}
            {result.lastUpdateTime && (
              <p className="line-clamp-1">
                <span className="text-muted-foreground/70">
                  {i18n.t("search.result.updated")}
                </span>
                {result.lastUpdateTime}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {result.category && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {result.category}
              </Badge>
            )}
            {result.status && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {result.status}
              </Badge>
            )}
            {result.wordCount && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                {result.wordCount}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>

      {/* Footer with Source Link */}
      <CardFooter className="p-4 pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs gap-1"
          asChild
        >
          <a
            href={result.url}
            target="_blank"
            rel="noreferrer"
          >
            {i18n.t("search.actions.sourceSite")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardFooter>
    </Card>
  )
}

function cn(...inputs: (string | undefined | null | false)[]) {
  return inputs.filter(Boolean).join(" ")
}
