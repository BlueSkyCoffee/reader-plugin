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
import { browser } from "wxt/browser"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LightNovelDownloader,
  useNovelDownloader,
  useNovelParser,
  useVolumeSelection,
} from "@/features/lightnovel/services"
import { cn } from "@/utils"
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
    <Tabs value={source} onValueChange={value => onSourceChange(value as "bili" | "wenku")}>
      <TabsList className="w-full">
        <TabsTrigger value="bili" className="flex-1">
          {browser.i18n.getMessage("lightnovel_source_bili")}
        </TabsTrigger>
        <TabsTrigger value="wenku" className="flex-1">
          {browser.i18n.getMessage("lightnovel_source_wenku")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
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
    <InputGroup>
      <InputGroupAddon>
        <Search />
      </InputGroupAddon>
      <InputGroupInput
        placeholder={
          source === "bili"
            ? browser.i18n.getMessage("lightnovel_search_placeholder_bili")
            : browser.i18n.getMessage("lightnovel_search_placeholder_wenku")
        }
        value={input}
        onChange={e => onInputChange(e.target.value)}
        onKeyDown={e => e.key === "Enter" && onSearch()}
        disabled={isLoading}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          onClick={onSearch}
          disabled={isLoading || !input.trim()}
        >
          {isLoading
            ? (
                <>
                  <Loader2 className="animate-spin" />
                  {browser.i18n.getMessage("lightnovel_search_parsing")}
                </>
              )
            : (
                <>
                  <Search />
                  {browser.i18n.getMessage("lightnovel_search_parse")}
                </>
              )}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
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
      <AlertCircle />
      <AlertTitle>{browser.i18n.getMessage("lightnovel_example_title")}</AlertTitle>
      <AlertDescription className="flex items-center gap-2">
        <code className="rounded bg-muted px-2 py-1 font-mono text-xs">
          {example}
        </code>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopy}
          className="size-6 p-0"
        >
          {copied
            ? <Check />
            : <Copy />}
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
    novelInfo.status && `${browser.i18n.getMessage("lightnovel_info_status")}${novelInfo.status}`,
    `${browser.i18n.getMessage("lightnovel_info_volumes")}${novelInfo.volumes.length}`,
    `${browser.i18n.getMessage("lightnovel_info_chapters")}${totalChapters}`,
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
                  {browser.i18n.getMessage("search_card_noCover")}
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
            {browser.i18n.getMessage("lightnovel_info_author")}
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
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="text-base">{browser.i18n.getMessage("lightnovel_volume_title")}</CardTitle>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={onSelectAll}>
            {browser.i18n.getMessage("lightnovel_volume_selectAll")}
          </Button>
          <Button size="sm" variant="outline" onClick={onClearSelection}>
            {browser.i18n.getMessage("lightnovel_volume_clear")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
                <Checkbox
                  checked={selectedVolumes.has(idx)}
                  onCheckedChange={() => onToggleVolume(idx)}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {volume.title}
                </span>
                <Badge variant="secondary">
                  {volume.chapters.length}
                  {" "}
                  {browser.i18n.getMessage("lightnovel_volume_chapterUnit")}
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
      <CardHeader>
        <CardTitle className="text-base">{browser.i18n.getMessage("lightnovel_range_title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{browser.i18n.getMessage("lightnovel_range_start")}</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{startChapter}</span>
          </div>
          <Slider
            min={1}
            max={maxStartChapter}
            step={1}
            value={[startChapter]}
            onValueChange={([v]) => onStartChange(v)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{browser.i18n.getMessage("lightnovel_range_end")}</Label>
            <span className="text-xs text-muted-foreground tabular-nums">{endChapter}</span>
          </div>
          <Slider
            min={1}
            max={maxEndChapter}
            step={1}
            value={[endChapter]}
            onValueChange={([v]) => onEndChange(v)}
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
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div>
          <CardTitle className="text-base">{browser.i18n.getMessage("lightnovel_download_title")}</CardTitle>
          <CardDescription>
            {progress.current}
            {" / "}
            {progress.total}
            {" ("}
            {Math.round(percentage)}
            %)
          </CardDescription>
        </div>
        <div className="flex gap-2">
          {isDownloading && (
            <>
              {isPaused
                ? (
                    <Button size="sm" variant="outline" onClick={onResume} className="gap-2">
                      <Play data-icon="inline-start" />
                      {browser.i18n.getMessage("lightnovel_download_resume")}
                    </Button>
                  )
                : (
                    <Button size="sm" variant="outline" onClick={onPause} className="gap-2">
                      <Pause data-icon="inline-start" />
                      {browser.i18n.getMessage("lightnovel_download_pause")}
                    </Button>
                  )}
              <Button size="sm" variant="outline" onClick={onStop} className="gap-2">
                <X data-icon="inline-start" />
                {browser.i18n.getMessage("lightnovel_download_stop")}
              </Button>
            </>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <Progress value={percentage} />
        {progress.currentChapter && (
          <p className="text-xs text-muted-foreground">
            {browser.i18n.getMessage("lightnovel_download_current")}
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
      toast.error(browser.i18n.getMessage("lightnovel_toast_inputRequired"))
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
      toast.error(browser.i18n.getMessage("lightnovel_toast_selectVolume"))
      return
    }
    if (!packer) {
      toast.error(browser.i18n.getMessage("lightnovel_toast_parseFirst"))
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
        toast.error(browser.i18n.getMessage("lightnovel_toast_noChapters"))
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

      toast.success(browser.i18n.getMessage("lightnovel_toast_downloadComplete"))
    }
    catch (error) {
      log.lightnovel.error("Download failed", error)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{browser.i18n.getMessage("lightnovel_title")}</h1>
          <p className="text-muted-foreground">
            {browser.i18n.getMessage("lightnovel_description")}
          </p>
        </div>
        <Tabs
          value={layout}
          onValueChange={value => handleLayoutChange(value as "grid" | "list")}
        >
          <TabsList>
            <TabsTrigger value="grid">
              <Grid2X2 />
            </TabsTrigger>
            <TabsTrigger value="list">
              <List />
            </TabsTrigger>
          </TabsList>
        </Tabs>
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
            <CardHeader>
              <CardTitle className="text-base">{browser.i18n.getMessage("lightnovel_options_title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{browser.i18n.getMessage("lightnovel_options_combineVolume")}</p>
                  <p className="text-xs text-muted-foreground">
                    {browser.i18n.getMessage("lightnovel_options_combineVolume_desc")}
                  </p>
                </div>
                <Switch
                  checked={combineVolume}
                  onCheckedChange={setCombineVolume}
                  disabled={selectedVolumes.size <= 1}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between gap-4 text-sm">
                <div>
                  <p className="font-medium">{browser.i18n.getMessage("lightnovel_options_chapterTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                    {browser.i18n.getMessage("lightnovel_options_chapterTitle_desc")}
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
            className="w-full gap-2"
            size="lg"
          >
            {isDownloading
              ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {browser.i18n.getMessage("lightnovel_download_downloading")}
                  </>
                )
              : (
                  <>
                    <Download data-icon="inline-start" />
                    {browser.i18n.getMessage("lightnovel_download_button")}
                  </>
                )}
          </Button>
        </>
      )}
    </div>
  )
}
