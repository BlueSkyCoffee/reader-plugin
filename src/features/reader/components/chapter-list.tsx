import { browser } from "wxt/browser"
import type { Chapter } from "@/types/novel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/utils"

interface ChapterListProps {
  chapters: Chapter[]
  currentIndex: number
  onSelect: (index: number) => void
}

/**
 * 章节列表组件
 * 显示可滚动的章节列表
 */
export function ChapterList({
  chapters,
  currentIndex,
  onSelect,
}: ChapterListProps) {
  if (chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">{browser.i18n.getMessage("reader_list_noMatch")}</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-1 p-4">
        {chapters.map((chapter, index) => (
          <Button
            key={chapter.url}
            variant="ghost"
            className={cn(
              "w-full justify-start rounded-md px-3 py-2.5 h-auto text-sm",
              index === currentIndex && "bg-primary text-primary-foreground shadow-sm",
            )}
            onClick={() => onSelect(index)}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="line-clamp-2 flex-1 text-xs leading-relaxed">
                {chapter.title}
              </span>
              {index === currentIndex && (
                <Badge variant="secondary" className="ml-2 shrink-0">
                  {browser.i18n.getMessage("reader_list_reading")}
                </Badge>
              )}
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  )
}
