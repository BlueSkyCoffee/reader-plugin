import { BookOpen, Download, Loader2, Search } from "lucide-react"
import * as React from "react"
import { useState } from "react"
import { SearchBar } from "@/components/app/search-bar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ParserProvider } from "@/features/lightnovel/services"
import { useNovelFetcher } from "@/features/search"
import { requestMessage } from "@/lib/messaging"
import { notifyAction } from "@/utils/browser-dialog"

export const NovelSearchCard: React.FC = () => {
  const [inputUrl, setInputUrl] = useState("")
  const [queryUrl, setQueryUrl] = useState("")
  const [inputError, setInputError] = useState<string | null>(null)
  const { data: novel, isLoading, error } = useNovelFetcher(queryUrl)

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = inputUrl.trim()
    if (!trimmed) {
      setInputError("请输入轻小说目录页链接")
      setQueryUrl("")
      return
    }

    const source = ParserProvider.getSource(trimmed)
    if (!source) {
      setInputError("暂不支持该站点，请输入 BiliNovel 或 Wenku8 链接")
      setQueryUrl("")
      return
    }

    setInputError(null)
    setQueryUrl(trimmed)
  }

  const handleDownload = async () => {
    if (!novel?.volumes) {
      return
    }

    const chapters = novel.volumes.flatMap(volume => volume.chapters)
    await requestMessage("startDownload", {
      novelId: novel.id,
      bookTitle: novel.title,
      source: novel.source,
      chapters,
    })

    notifyAction(`成功加入下载队列：《${novel.title}》，共 ${chapters.length} 章节`)
  }

  return (
    <Card className="w-full p-3">
      <div className="flex flex-col gap-3">
        <SearchBar
          value={inputUrl}
          onChange={(value) => {
            setInputUrl(value)
            if (inputError) {
              setInputError(null)
            }
          }}
          placeholder="输入小说目录页链接"
          onSubmit={handleSearch}
          inputClassName="h-10 pr-12 text-sm bg-background"
          actionClassName="right-1"
          inputProps={{
            "type": "url",
            "inputMode": "url",
            "aria-invalid": !!inputError,
          }}
          action={(
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className="h-8 w-8"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </Button>
          )}
        />

        {inputError && (
          <Alert variant="destructive">
            <AlertTitle>链接不可用</AlertTitle>
            <AlertDescription>{inputError}</AlertDescription>
          </Alert>
        )}

        {!inputError && !error && (
          <p className="text-[11px] text-muted-foreground">
            支持 BiliNovel 与 Wenku8 的目录页链接。
          </p>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertTitle>抓取失败</AlertTitle>
            <AlertDescription>{(error as Error).message}</AlertDescription>
          </Alert>
        )}

        {novel && (
          <Card className="overflow-hidden animate-in fade-in slide-in-from-bottom-2">
            <div className="h-24 bg-gradient-to-r from-primary to-primary/80 relative">
              {novel.cover && (
                <img
                  src={novel.cover}
                  alt={novel.title}
                  className="absolute -bottom-4 left-4 w-14 h-20 object-cover rounded-md shadow-md border-2 border-background"
                />
              )}
            </div>

            <CardContent className="px-4 pt-6 pb-4">
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-base font-bold line-clamp-1">{novel.title}</h2>
                  <p className="text-[11px] text-muted-foreground">{novel.author}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1 h-8 text-xs"
                    variant="default"
                    type="button"
                  >
                    <BookOpen className="size-3.5 mr-1" />
                    开始阅读
                  </Button>
                  <Button
                    onClick={handleDownload}
                    title="全部下载"
                    variant="outline"
                    size="icon"
                    type="button"
                    className="h-8 w-8"
                  >
                    <Download className="size-3.5" />
                  </Button>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">
                    {novel.source.toUpperCase()}
                  </Badge>
                  <span>•</span>
                  <span>
                    共
                    {novel.volumes.length}
                    {" "}
                    卷
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Card>
  )
}
