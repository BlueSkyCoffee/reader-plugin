import type { Book } from "@/types/novel"
import { BookOpen, Download, Play, Trash2 } from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { useReaderNavigation } from "@/features/reader"

interface BookCardProps {
  book: Book
  isActive: boolean
  onSelect: (id: string) => void
  onDelete: (id: string, e: React.MouseEvent) => void
  onDownload: (book: Book) => void
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  isActive,
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

  return (
    <div
      onClick={() => onSelect(book.id)}
      className={`group relative flex flex-col items-center p-4 rounded-xl border transition-all cursor-pointer ${
        isActive
          ? "border-primary bg-primary/10 shadow-md ring-1 ring-primary"
          : "border-border hover:border-border hover:bg-muted/50 hover:shadow-sm"
      }`}
    >
      <div className="relative w-32 h-44 mb-4 rounded-lg overflow-hidden shadow-sm bg-muted flex items-center justify-center">
        {book.cover
          ? (
              <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
            )
          : (
              <div className="text-muted-foreground text-sm italic">封面加载中...</div>
            )}
        {isActive && (
          <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
            <BookOpen className="text-primary size-10" />
          </div>
        )}
      </div>
      <div className="w-full text-center">
        <h3 className="font-bold text-foreground line-clamp-1 mb-1 text-sm" title={book.title}>
          {book.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 mb-2 italic">
          {book.author || "未知作者"}
        </p>
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
            {book.totalChapters}
            {" "}
            章节
          </span>
          <Badge variant="secondary">
            {((book.progress?.chapterIndex || 0) / (book.totalChapters || 1) * 100).toFixed(0)}
            %
          </Badge>
        </div>
      </div>

      <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleContinueReading}
          className="p-1.5 bg-background/90 text-muted-foreground hover:text-primary rounded-lg shadow-sm border border-border"
          title="继续阅读"
        >
          <Play size={14} />
        </button>
        <button
          onClick={e => onDelete(book.id, e)}
          className="p-1.5 bg-background/90 text-muted-foreground hover:text-destructive rounded-lg shadow-sm border border-border"
          title="删除书籍"
        >
          <Trash2 size={14} />
        </button>
        <button
          onClick={handleDownloadClick}
          className="p-1.5 bg-background/90 text-muted-foreground hover:text-primary rounded-lg shadow-sm border border-border"
          title="导出 EPUB"
        >
          <Download size={14} />
        </button>
      </div>
    </div>
  )
}
