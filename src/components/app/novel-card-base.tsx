import { BookOpen } from "lucide-react"
import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/utils/cn"

interface NovelCardCover {
  src?: string
  alt: string
  fallback?: React.ReactNode
}

interface NovelCardBaseProps {
  layout?: "grid" | "list"
  cover?: NovelCardCover
  badges?: React.ReactNode
  header: React.ReactNode
  meta?: React.ReactNode
  actions: React.ReactNode
  activeIndicator?: boolean
  onClick?: () => void
  className?: string
  actionsOverlay?: React.ReactNode
}

function CoverImage({ cover, size = "grid" }: { cover?: NovelCardCover, size?: "grid" | "list" }) {
  const containerClass = size === "grid"
    ? "relative aspect-[3/4] w-full overflow-hidden rounded-lg"
    : "relative h-20 w-14 shrink-0 overflow-hidden rounded-md"

  if (cover?.src) {
    return (
      <div className={containerClass}>
        <img src={cover.src} alt={cover.alt} className="h-full w-full object-cover" />
      </div>
    )
  }

  return (
    <div className={cn(containerClass, "bg-gradient-to-br from-muted to-accent flex items-center justify-center")}>
      {cover?.fallback ?? <BookOpen className={size === "grid" ? "size-8 text-muted-foreground/40" : "size-5 text-muted-foreground/40"} />}
    </div>
  )
}

export const NovelCardBase: React.FC<NovelCardBaseProps> = ({
  layout = "grid",
  cover,
  badges,
  header,
  meta,
  actions,
  activeIndicator,
  onClick,
  className,
  actionsOverlay,
}) => {
  if (layout === "list") {
    return (
      <Card
        onClick={onClick}
        className={cn(
          "group cursor-pointer transition-all duration-200 hover:shadow-md",
          activeIndicator && "border-l-[3px] border-l-primary bg-primary/5",
          className,
        )}
      >
        <CardContent className="flex items-center gap-3 p-3 sm:gap-4">
          <div className="relative">
            <CoverImage cover={cover} size="list" />
            {badges && (
              <div className="absolute -right-1 -top-1 flex flex-col items-end gap-1">
                {badges}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            {header}
            {meta && <div className="mt-1.5">{meta}</div>}
          </div>

          <div className="shrink-0 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            {actions}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group flex h-full cursor-pointer flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
        activeIndicator && "border-l-[3px] border-l-primary bg-primary/5",
        className,
      )}
    >
      <div className="relative">
        <CoverImage cover={cover} size="grid" />
        {badges && (
          <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
            {badges}
          </div>
        )}
        {actionsOverlay && (
          <div className="absolute right-2 top-2 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
            {actionsOverlay}
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-2 p-3">
        {header}
        {meta}
      </CardContent>

      <div className="border-t border-border/50 px-3 pb-3 pt-2.5">
        {actions}
      </div>
    </Card>
  )
}
