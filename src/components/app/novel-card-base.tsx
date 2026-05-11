import { BookOpen } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/utils"

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
    : "relative size-10 shrink-0 overflow-hidden rounded-md"

  if (cover?.src) {
    return (
      <div className={containerClass}>
        <img src={cover.src} alt={cover.alt} className="size-full object-cover" />
      </div>
    )
  }

  return (
    <div className={cn(containerClass, "bg-muted flex items-center justify-center")}>
      {cover?.fallback ?? <BookOpen className={size === "grid" ? "size-8 text-muted-foreground/40" : "size-4 text-muted-foreground/40"} />}
    </div>
  )
}

/**
 * 列表模式：紧凑横向布局，与 popup 卡片风格一致
 */
function ListCard({
  cover,
  badges,
  header,
  meta,
  actions,
  activeIndicator,
  onClick,
  className,
}: Omit<NovelCardBaseProps, "layout" | "actionsOverlay">) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start gap-2.5 rounded-lg px-2.5 py-2 h-auto",
        activeIndicator && "border-l-[3px] border-l-primary bg-primary/5",
        className,
      )}
      onClick={onClick}
    >
      <div className="relative">
        <CoverImage cover={cover} size="list" />
        {badges && (
          <div className="absolute -right-1 -top-1 flex flex-col items-end gap-0.5">
            {badges}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {header}
        {meta && <div className="mt-0.5">{meta}</div>}
      </div>

      <div className="shrink-0">
        {actions}
      </div>
    </Button>
  )
}

/**
 * 网格模式：封面大图卡片，使用 shadcn Card 风格但去掉 rounded-4xl
 */
function GridCard({
  cover,
  badges,
  header,
  meta,
  actions,
  activeIndicator,
  onClick,
  className,
  actionsOverlay,
}: Omit<NovelCardBaseProps, "layout">) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={e => (e.key === "Enter" || e.key === " ") && onClick?.()}
      className={cn(
        "group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border/60 bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md",
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

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {header}
        {meta}
      </div>

      <div className="border-t border-border/50 px-3 pb-3 pt-2">
        {actions}
      </div>
    </div>
  )
}

export const NovelCardBase: React.FC<NovelCardBaseProps> = ({
  layout = "list",
  ...props
}) => {
  if (layout === "list") {
    return <ListCard {...props} />
  }
  return <GridCard {...props} />
}
