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
  Loader2,
  Pause,
  Play,
  Search,
  X,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
import { log } from "@/utils/logger"

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
function NovelInfoCard({ novelInfo }: { novelInfo: LightNovelInfo }) {
  const totalChapters = novelInfo.volumes.reduce(
    (sum, v) => sum + v.chapters.length,
    0,
  )

  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex gap-4">
        {novelInfo.cover && (
          <img
            src={novelInfo.cover}
            alt={novelInfo.title}
            className="w-24 h-32 object-cover rounded"
          />
        )}
        <div className="flex-1">
          <h2 className="text-xl font-bold">{novelInfo.title}</h2>
          <p className="text-sm text-muted-foreground">
            {i18n.t("lightnovel.info.author")}
            {novelInfo.author}
          </p>
          <p className="text-sm text-muted-foreground">
            {i18n.t("lightnovel.info.status")}
            {novelInfo.status}
          </p>
          <p className="text-sm text-muted-foreground">
            {i18n.t("lightnovel.info.volumes")}
            {novelInfo.volumes.length}
            {" "}
            |
            {" "}
            {i18n.t("lightnovel.info.chapters")}
            {totalChapters}
          </p>
          {novelInfo.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
              {novelInfo.description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * 卷选择器
 */
function VolumeSelector({
  novelInfo,
  selectedVolumes,
  onToggleVolume,
  onSelectAll,
  onClearSelection,
}: {
  novelInfo: LightNovelInfo
  selectedVolumes: Set<number>
  onToggleVolume: (idx: number) => void
  onSelectAll: () => void
  onClearSelection: () => void
}) {
  return (
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{i18n.t("lightnovel.volume.title")}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onSelectAll}>
            {i18n.t("lightnovel.volume.selectAll")}
          </Button>
          <Button size="sm" variant="outline" onClick={onClearSelection}>
            {i18n.t("lightnovel.volume.clear")}
          </Button>
        </div>
      </div>
      <ScrollArea className="max-h-64">
        <div className="grid grid-cols-2 gap-2 pr-4">
          {novelInfo.volumes.map((volume, idx) => (
            <label
              key={`${volume.title}-${volume.chapters[0]?.url ?? volume.title}`}
              className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedVolumes.has(idx)}
                onChange={() => onToggleVolume(idx)}
                className="w-4 h-4"
              />
              <span className="text-sm">
                {volume.title}
                {" "}
                (
                {volume.chapters.length}
                {" "}
                {i18n.t("lightnovel.volume.chapterUnit")}
                )
              </span>
            </label>
          ))}
        </div>
      </ScrollArea>
    </div>
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
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <h3 className="font-semibold">{i18n.t("lightnovel.range.title")}</h3>
      <div className="grid grid-cols-2 gap-4">
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
      </div>
    </div>
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
    <div className="border rounded-lg p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{i18n.t("lightnovel.download.title")}</h3>
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
      </div>

      <div className="flex flex-col gap-2">
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
      </div>
    </div>
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
      <div>
        <h1 className="text-3xl font-bold mb-2">{i18n.t("lightnovel.title")}</h1>
        <p className="text-muted-foreground">
          {i18n.t("lightnovel.description")}
        </p>
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
          <NovelInfoCard novelInfo={novelInfo} />

          {/* 卷选择 */}
          <VolumeSelector
            novelInfo={novelInfo}
            selectedVolumes={selectedVolumes}
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
          <div className="border rounded-lg p-4 flex flex-col gap-3">
            <h3 className="font-semibold">{i18n.t("lightnovel.options.title")}</h3>
            <div className="flex items-center justify-between text-sm">
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
            <div className="flex items-center justify-between text-sm">
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
          </div>

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
