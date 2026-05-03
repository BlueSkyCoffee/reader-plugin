/**
 * 轻小说下载页面
 * 支持哔哩轻小说和轻小说文库的下载
 */

import type { LightNovelInfo } from "@/features/lightnovel/services"
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Grid2X2,
  List,
  Loader2,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import {
  LightNovelDownloader,
  useNovelDownloader,
  useNovelParser,
  useVolumeSelection,
} from "@/features/lightnovel/services"
import { i18n } from "@/i18n"
import { cn } from "@/utils/cn"
import { log } from "@/utils/logger"

type NovelLayout = "grid" | "list"
const LIGHTNOVEL_LAYOUT_STORAGE_KEY = "lightnovel-layout"

function getInitialLightNovelLayout(): NovelLayout {
  if (typeof window === "undefined") {
    return "grid"
  }

  try {
    const savedLayout = window.localStorage.getItem(LIGHTNOVEL_LAYOUT_STORAGE_KEY)
    return savedLayout === "list" ? "list" : "grid"
  }
  catch {
    return "grid"
  }
}

/**
 * 来源选择器
 */
function SourceSelector({
  source,
  onSourceChange,
}: {
  source: "bili" | "wenku"
  onSourceChange: (source: "bili" | "wenku") => void
}) {
  return (
    <div className="flex gap-2">
      <Button
        variant={source === "bili" ? "default" : "outline"}
        onClick={() => onSourceChange("bili")}
        className="flex-1"
      >
        {i18n.t("lightnovel.source.bili")}
      </Button>
      <Button
        variant={source === "wenku" ? "default" : "outline"}
        onClick={() => onSourceChange("wenku")}
        className="flex-1"
      >
        {i18n.t("lightnovel.source.wenku")}
      </Button>
    </div>
  )
}

/**
 * 搜索输入框
 */
function SearchInput({
  input,
  onInputChange,
  onSearch,
  isLoading,
  source,
}: {
  input: string
  onInputChange: (value: string) => void
  onSearch: () => void
  isLoading: boolean
  source: "bili" | "wenku"
}) {
  return (
    <div className="flex gap-2">
      <Input
        placeholder={
          source === "bili"
            ? i18n.t("lightnovel.search.placeholder.bili")
            : i18n.t("lightnovel.search.placeholder.wenku")
        }
        value={input}
        onChange={e => onInputChange(e.target.value)}
        onKeyPress={e => e.key === "Enter" && onSearch()}
        disabled={isLoading}
        className="flex-1"
      />
      <Button
        onClick={onSearch}
        disabled={isLoading || !input.trim()}
        className="gap-2"
      >
        {isLoading
          ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {i18n.t("lightnovel.search.parsing")}
              </>
            )
          : (
              <>
                <Search className="size-4" />
                {i18n.t("lightnovel.search.parse")}
              </>
            )}
      </Button>
    </div>
  )
}

/**
 * 使用示例
 */
function UsageExample({ source }: { source: "bili" | "wenku" }) {
  const [copied, setCopied] = useState(false)

  const example = source === "bili" ? "1234567" : "1234"

  const handleCopy = () => {
    void navigator.clipboard.writeText(example)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Alert>
      <AlertCircle className="size-4" />
      <AlertTitle>{i18n.t("lightnovel.example.title")}</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
          {example}
        </code>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="size-6 p-0"
        >
          {copied
            ? <Check className="size-3" />
            : <Copy className="size-3" />}
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/**
 * 小说信息卡片
 */
function NovelInfoCard({
  novelInfo,
  layout,
}: {
  novelInfo: LightNovelInfo
  layout: NovelLayout
}) {
  const totalChapters = novelInfo.volumes.reduce(
    (sum, v) => sum + v.chapters.length,
    0,
  )

  const stats = [
    novelInfo.status && `${i18n.t("lightnovel.info.status")}${novelInfo.status}`,
    `${i18n.t("lightnovel.info.volumes")}${novelInfo.volumes.length}`,
    `${i18n.t("lightnovel.info.chapters")}${totalChapters}`,
  ].filter(Boolean) as string[]

  return (
    <Card>
      <CardContent
        className={cn(
          "p-4",
          layout === "grid"
            ? "grid gap-4 sm:grid-cols-[8rem_1fr]"
            : "flex items-start gap-4",
        )}
      >
        <div
          className={cn(
            "shrink-0 overflow-hidden rounded-md bg-muted shadow-sm",
            layout === "grid" ? "aspect-[5/7] w-32" : "h-28 w-20",
          )}
        >
          {novelInfo.cover
            ? (
                <img
                  src={novelInfo.cover}
                  alt={novelInfo.title}
                  className="h-full w-full object-cover"
                />
              )
            : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {i18n.t("search.card.noCover")}
                </div>
              )}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-start gap-2">
            <h2 className="min-w-0 flex-1 text-xl font-semibold leading-tight" title={novelInfo.title}>
              {novelInfo.title}
            </h2>
            <Badge variant="secondary">{novelInfo.source.toUpperCase()}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {i18n.t("lightnovel.info.author")}
            {novelInfo.author}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.map(stat => (
              <Badge key={stat} variant="outline">
                {stat}
              </Badge>
            ))}
          </div>
          {novelInfo.description && (
            <p
              className={cn(
                "mt-3 text-sm leading-6 text-muted-foreground",
                layout === "grid" ? "line-clamp-3" : "line-clamp-2",
              )}
            >
              {novelInfo.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 卷选择器
 */
function VolumeSelector({
  novelInfo,
  selectedVolumes,
  layout,
  onToggleVolume,
  onSelectAll,
  onClearSelection,
}: {
  novelInfo: LightNovelInfo
  selectedVolumes: Set<number>
  layout: NovelLayout
  onToggleVolume: (idx: number) => void
  onSelectAll: () => void
  onClearSelection: () => void
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 p-4 pb-3">
        <CardTitle className="text-base">{i18n.t("lightnovel.volume.title")}</CardTitle>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={onSelectAll}>
            {i18n.t("lightnovel.volume.selectAll")}
          </Button>
          <Button size="sm" variant="outline" onClick={onClearSelection}>
            {i18n.t("lightnovel.volume.clear")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <ScrollArea className="max-h-64">
          <div
            className={cn(
              "pr-4",
              layout === "grid" ? "grid grid-cols-1 gap-2 sm:grid-cols-2" : "flex flex-col gap-2",
            )}
          >
            {novelInfo.volumes.map((volume, idx) => (
              <label
                key={`${volume.title}-${volume.chapters[0]?.url ?? volume.title}`}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 transition hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selectedVolumes.has(idx)}
                  onChange={() => onToggleVolume(idx)}
                  className="size-4"
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {volume.title}
                </span>
                <Badge variant="secondary">
                  {volume.chapters.length}
                  {" "}
                  {i18n.t("lightnovel.volume.chapterUnit")}
                </Badge>
              </label>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

/**
 * 章节范围输入
 */
function ChapterRangeInput({
  novelInfo,
  selectedVolumes,
  startChapter,
  endChapter,
  onStartChange,
  onEndChange,
}: {
  novelInfo: LightNovelInfo
  selectedVolumes: Set<number>
  startChapter: number
  endChapter: number
  onStartChange: (val: number) => void
  onEndChange: (val: number) => void
}) {
  const selectedList = Array.from(selectedVolumes).sort((a, b) => a - b)
  const firstVolume = selectedList[0]
  const lastVolume = selectedList[selectedList.length - 1]

  const maxStartChapter = firstVolume !== undefined ? novelInfo.volumes[firstVolume]?.chapters.length || 1 : 1
  const maxEndChapter = lastVolume !== undefined ? novelInfo.volumes[lastVolume]?.chapters.length || 1 : 1

  return (
    <Card>
      <CardHeader className="p-4 pb-3">
        <CardTitle className="text-base">{i18n.t("lightnovel.range.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 p-4 pt-0">
        <div>
          <label className="text-sm font-medium">{i18n.t("lightnovel.range.start")}</label>
          <Input
            type="number"
            min="1"
            max={maxStartChapter}
            value={startChapter}
            onChange={e => onStartChange(Math.max(1, Number.parseInt(e.target.value) || 1))}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-sm font-medium">{i18n.t("lightnovel.range.end")}</label>
          <Input
            type="number"
            min="1"
            max={maxEndChapter}
            value={endChapter}
            onChange={e => onEndChange(Math.max(1, Number.parseInt(e.target.value) || 1))}
            className="mt-1"
          />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 下载进度条
 */
function DownloadProgressBar({
  progress,
  isDownloading,
  isPaused,
  onPause,
  onResume,
  onStop,
}: {
  progress: { current: number, total: number, status: string, currentChapter?: string }
  isDownloading: boolean
  isPaused: boolean
  onPause: () => void
  onResume: () => void
  onStop: () => void
}) {
  const percentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3 p-4 pb-3">
        <CardTitle className="text-base">{i18n.t("lightnovel.download.title")}</CardTitle>
        <div className="flex gap-2">
          {isDownloading && (
            <>
              {isPaused
                ? (
                    <Button size="sm" variant="outline" onClick={onResume} className="gap-2">
                      <Play className="size-4" data-icon="inline-start" />
                      {i18n.t("lightnovel.download.resume")}
                    </Button>
                  )
                : (
                    <Button size="sm" variant="outline" onClick={onPause} className="gap-2">
                      <Pause className="size-4" data-icon="inline-start" />
                      {i18n.t("lightnovel.download.pause")}
                    </Button>
                  )}
              <Button size="sm" variant="outline" onClick={onStop} className="gap-2">
                <X className="size-4" data-icon="inline-start" />
                {i18n.t("lightnovel.download.stop")}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2 p-4 pt-0">
        <div className="flex items-center justify-between text-sm">
          <span>
            {progress.current}
            {" "}
            /
            {progress.total}
          </span>
          <span>
            {Math.round(percentage)}
            %
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {progress.currentChapter && (
          <p className="text-xs text-muted-foreground">
            {i18n.t("lightnovel.download.current")}
            {progress.currentChapter}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 轻小说下载页面主组件
 */
export function LightNovelPage() {
  const [source, setSource] = useState<"bili" | "wenku">("bili")
  const [input, setInput] = useState("")
  const [novelInfo, setNovelInfo] = useState<LightNovelInfo | null>(null)
  const [combineVolume, setCombineVolume] = useState(false)
  const [addChapterTitle, setAddChapterTitle] = useState(false)
  const [layout, setLayout] = useState<NovelLayout>(getInitialLightNovelLayout)

  const { parseNovel, isLoading: isParsing, packer } = useNovelParser()
  const {
    isDownloading,
    isPaused,
    progress,
    startDownload,
    pauseDownload,
    resumeDownload,
    stopDownload,
  } = useNovelDownloader()

  const {
    selectedVolumes,
    startChapter,
    setStartChapter,
    endChapter,
    setEndChapter,
    toggleVolume,
    selectAllVolumes,
    clearSelection,
  } = useVolumeSelection(novelInfo?.volumes.length || 0)

  const handleLayoutChange = (nextLayout: NovelLayout) => {
    setLayout(nextLayout)
    try {
      window.localStorage.setItem(LIGHTNOVEL_LAYOUT_STORAGE_KEY, nextLayout)
    }
    catch {
      // Layout persistence is optional.
    }
  }

  const handleSearch = async () => {
    if (!input.trim()) {
      toast.error(i18n.t("lightnovel.toast.inputRequired"))
      return
    }

    try {
      const info = await parseNovel(input, source)
      setNovelInfo(info)
      setStartChapter(1)
      setEndChapter(info.volumes[0]?.chapters.length || 1)
      setCombineVolume(false)
    }
    catch (error) {
      log.lightnovel.error("Parse failed", error)
    }
  }

  const handleDownload = async () => {
    if (!novelInfo || selectedVolumes.size === 0) {
      toast.error(i18n.t("lightnovel.toast.selectVolume"))
      return
    }
    if (!packer) {
      toast.error(i18n.t("lightnovel.toast.parseFirst"))
      return
    }

    try {
      const totalChapters = LightNovelDownloader.calculateTotalChapters(
        novelInfo,
        selectedVolumes,
        startChapter,
        endChapter,
      )

      if (totalChapters === 0) {
        toast.error(i18n.t("lightnovel.toast.noChapters"))
        return
      }

      await startDownload(
        packer,
        {
          novelInfo,
          selectedVolumes,
          startChapter,
          endChapter,
        },
        {
          combineVolume: combineVolume && selectedVolumes.size > 1,
          addChapterTitle,
        },
      )

      toast.success(i18n.t("lightnovel.toast.downloadComplete"))
    }
    catch (error) {
      log.lightnovel.error("Download failed", error)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{i18n.t("lightnovel.title")}</h1>
          <p className="text-muted-foreground">
            {i18n.t("lightnovel.description")}
          </p>
        </div>
        <div className="flex shrink-0 items-center rounded-lg border bg-background p-1">
          <Button
            type="button"
            size="icon"
            variant={layout === "grid" ? "secondary" : "ghost"}
            className={cn("size-8", layout === "grid" && "shadow-sm")}
            aria-label={i18n.t("lightnovel.layout.grid")}
            title={i18n.t("lightnovel.layout.grid")}
            onClick={() => handleLayoutChange("grid")}
          >
            <Grid2X2 className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={layout === "list" ? "secondary" : "ghost"}
            className={cn("size-8", layout === "list" && "shadow-sm")}
            aria-label={i18n.t("lightnovel.layout.list")}
            title={i18n.t("lightnovel.layout.list")}
            onClick={() => handleLayoutChange("list")}
          >
            <List className="size-4" />
          </Button>
        </div>
      </div>

      {/* 来源选择 */}
      <SourceSelector source={source} onSourceChange={setSource} />

      {/* 搜索输入 */}
      <SearchInput
        input={input}
        onInputChange={setInput}
        onSearch={handleSearch}
        isLoading={isParsing}
        source={source}
      />

      {/* 使用示例 */}
      <UsageExample source={source} />

      {/* 小说信息 */}
      {novelInfo && (
        <>
          <NovelInfoCard novelInfo={novelInfo} layout={layout} />

          {/* 卷选择 */}
          <VolumeSelector
            novelInfo={novelInfo}
            selectedVolumes={selectedVolumes}
            layout={layout}
            onToggleVolume={toggleVolume}
            onSelectAll={selectAllVolumes}
            onClearSelection={clearSelection}
          />

          {/* 章节范围 */}
          <ChapterRangeInput
            novelInfo={novelInfo}
            selectedVolumes={selectedVolumes}
            startChapter={startChapter}
            endChapter={endChapter}
            onStartChange={setStartChapter}
            onEndChange={setEndChapter}
          />

          {/* 打包选项 */}
          <Card>
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-base">{i18n.t("lightnovel.options.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 p-4 pt-0">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{i18n.t("lightnovel.options.combineVolume")}</p>
                  <p className="text-xs text-muted-foreground">
                    {i18n.t("lightnovel.options.combineVolume.desc")}
                  </p>
                </div>
                <Switch
                  checked={combineVolume}
                  onCheckedChange={setCombineVolume}
                  disabled={selectedVolumes.size <= 1}
                />
              </div>
              <div className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{i18n.t("lightnovel.options.chapterTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {i18n.t("lightnovel.options.chapterTitle.desc")}
                  </p>
                </div>
                <Switch
                  checked={addChapterTitle}
                  onCheckedChange={setAddChapterTitle}
                />
              </div>
            </CardContent>
          </Card>

          {/* 下载进度 */}
          {isDownloading && (
            <DownloadProgressBar
              progress={progress}
              isDownloading={isDownloading}
              isPaused={isPaused}
              onPause={pauseDownload}
              onResume={resumeDownload}
              onStop={stopDownload}
            />
          )}

          {/* 下载按钮 */}
          <Button
            onClick={handleDownload}
            disabled={isDownloading || selectedVolumes.size === 0}
            className="w-full gap-2 h-10"
            size="lg"
          >
            {isDownloading
              ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {i18n.t("lightnovel.download.downloading")}
                  </>
                )
              : (
                  <>
                    <Download className="size-4" data-icon="inline-start" />
                    {i18n.t("lightnovel.download.button")}
                  </>
                )}
          </Button>
        </>
      )}
    </div>
  )
}
