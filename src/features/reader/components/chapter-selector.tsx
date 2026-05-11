import { browser } from "wxt/browser"
import type { Chapter } from "@/types/novel"
import { List } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ChapterList } from "./chapter-list"

interface ChapterSelectorProps {
  chapters: Chapter[]
  currentChapterIndex: number
  onSelectChapter: (index: number) => void
}

/**
 * 章节选择器组件
 * 提供侧边栏式的章节浏览和快速跳转功能
 */
export function ChapterSelector({
  chapters,
  currentChapterIndex,
  onSelectChapter,
}: ChapterSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // 过滤章节
  const filteredChapters = chapters.filter(ch =>
    ch.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleSelectChapter = (index: number) => {
    onSelectChapter(index)
    setOpen(false)
    setSearchQuery("")
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <List className="size-4" data-icon="inline-start" />
          {browser.i18n.getMessage("reader_toc_title")}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>{browser.i18n.getMessage("reader_toc_sheetTitle")}</SheetTitle>
          <p className="text-xs text-muted-foreground mt-2">
            {browser.i18n.getMessage("reader_toc_totalChapters", [String(chapters.length)])}
            {" "}
            ·
            {" "}
            {browser.i18n.getMessage("reader_toc_currentChapter", [String(currentChapterIndex + 1)])}
          </p>
        </SheetHeader>

        {/* 搜索框 */}
        <div className="px-6 py-3 border-b">
          <Input
            placeholder={browser.i18n.getMessage("reader_toc_searchPlaceholder")}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="h-9"
          />
          {searchQuery && (
            <p className="text-xs text-muted-foreground mt-2">
              {browser.i18n.getMessage("reader_toc_searchResult", [String(filteredChapters.length)])}
            </p>
          )}
        </div>

        {/* 章节列表 */}
        <div className="flex-1 overflow-hidden">
          <ChapterList
            chapters={filteredChapters}
            currentIndex={currentChapterIndex}
            onSelect={handleSelectChapter}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
