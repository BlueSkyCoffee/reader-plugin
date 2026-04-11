/**
 * 轻小说下载相关的 React Hooks
 */

import type {
  DownloadProgress,
  DownloadTaskConfig,
  LightNovelInfo,
} from "./types"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { LightNovelPacker } from "./packer/lightnovel-packer"
import { PackArgument, Volume } from "./packer/types"

/**
 * 轻小说解析 Hook
 */
export function useNovelParser() {
  const [isLoading, setIsLoading] = useState(false)
  const [packer, setPacker] = useState<LightNovelPacker | null>(null)

  const parseNovel = useCallback(
    async (input: string, source: "bili" | "wenku"): Promise<LightNovelInfo> => {
      setIsLoading(true)

      try {
        const normalized = normalizeLightNovelInput(input, source)
        const packerInstance = LightNovelPacker.fromUrl(normalized)
        await packerInstance.init()

        const novelInfo = buildLightNovelInfo(packerInstance, source)
        setPacker(packerInstance)

        const totalChapters = novelInfo.volumes.reduce(
          (sum, v) => sum + v.chapters.length,
          0,
        )

        toast.success(
          `成功获取《${novelInfo.title}》的信息，共 ${novelInfo.volumes.length} 卷 ${totalChapters} 章`,
        )

        return novelInfo
      }
      catch (error: unknown) {
        console.error("[useNovelParser] Parse error:", error)
        const errorMessage
          = error instanceof Error ? error.message : "解析失败，请检查输入是否正确"
        toast.error(errorMessage)
        throw error
      }
      finally {
        setIsLoading(false)
      }
    },
    [],
  )

  return { parseNovel, isLoading, packer }
}

/**
 * 轻小说下载 Hook
 */
export function useNovelDownloader() {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState<DownloadProgress>({
    current: 0,
    total: 0,
    status: "idle",
  })
  const [packer, setPacker] = useState<LightNovelPacker | null>(null)

  const startDownload = useCallback(
    async (
      packerInstance: LightNovelPacker,
      config: DownloadTaskConfig,
      options: { combineVolume: boolean, addChapterTitle: boolean },
    ) => {
      setIsDownloading(true)
      setIsPaused(false)
      setProgress({ current: 0, total: 0, status: "downloading" })

      try {
        setPacker(packerInstance)
        const packVolumes = buildPackVolumes(packerInstance, config)
        if (packVolumes.length === 0) {
          throw new Error("未选择任何卷")
        }
        const packArg = new PackArgument({
          addChapterTitle: options.addChapterTitle,
          combineVolume: options.combineVolume,
          packVolumes,
        })

        const totalChapters = packVolumes.reduce((sum, volume) => sum + volume.chapters.length, 0)
        setProgress({ current: 0, total: totalChapters, status: "downloading" })

        await packerInstance.packAndDownload(packArg, (prog) => {
          setProgress({
            current: prog.current,
            total: prog.total,
            status: prog.status,
            currentChapter: prog.currentChapter,
          })
          config.onProgress?.({
            current: prog.current,
            total: prog.total,
            status: prog.status,
            currentChapter: prog.currentChapter,
          })
        })

        toast.success("下载完成")
      }
      catch (error: unknown) {
        console.error("[useNovelDownloader] Download error:", error)
        const errorMessage
          = error instanceof Error ? error.message : "下载失败"
        toast.error(errorMessage)
        throw error
      }
      finally {
        setIsDownloading(false)
        setPacker(null)
      }
    },
    [],
  )

  const pauseDownload = useCallback(() => {
    if (packer) {
      packer.pause()
      setIsPaused(true)
      toast.info("下载已暂停")
    }
  }, [packer])

  const resumeDownload = useCallback(() => {
    if (packer) {
      packer.resume()
      setIsPaused(false)
      toast.info("下载已恢复")
    }
  }, [packer])

  const stopDownload = useCallback(() => {
    if (packer) {
      packer.stop()
      setIsDownloading(false)
      setIsPaused(false)
      toast.info("下载已停止")
    }
  }, [packer])

  return {
    isDownloading,
    isPaused,
    progress,
    startDownload,
    pauseDownload,
    resumeDownload,
    stopDownload,
  }
}

function normalizeLightNovelInput(input: string, source: "bili" | "wenku") {
  const trimmed = input.trim()
  if (trimmed.startsWith("http")) {
    return trimmed.replace("wenku8.com", "wenku8.net")
  }
  if (source === "bili") {
    return `https://www.bilinovel.com/novel/${trimmed}`
  }
  return `https://www.wenku8.net/book/${trimmed}.htm`
}

function buildLightNovelInfo(packer: LightNovelPacker, source: "bili" | "wenku"): LightNovelInfo {
  const novel = packer.novel
  const volumes = packer.catalog.volumes.map(volume => ({
    title: volume.volumeName,
    cover: volume.cover,
    chapters: volume.chapters.map(chapter => ({
      title: chapter.chapterName,
      url: chapter.chapterUrl ?? "",
    })),
  }))

  return {
    id: novel.id,
    title: novel.title,
    author: novel.author,
    cover: novel.coverUrl,
    status: novel.status,
    description: novel.description,
    alias: novel.alias,
    tags: novel.tags,
    publisher: novel.publisher,
    url: novel.url,
    volumes,
    source,
  }
}

function buildPackVolumes(
  packerInstance: LightNovelPacker,
  config: DownloadTaskConfig,
): Volume[] {
  const selectedList = Array.from(config.selectedVolumes).sort((a, b) => a - b)
  if (selectedList.length === 0) {
    return []
  }
  const packVolumes: Volume[] = []
  const lastIndex = selectedList[selectedList.length - 1]

  selectedList.forEach((volumeIdx) => {
    const volume = packerInstance.catalog.volumes[volumeIdx]
    if (!volume)
      return
    const volumeStart = volumeIdx === selectedList[0] ? config.startChapter - 1 : 0
    const volumeEnd = volumeIdx === lastIndex ? config.endChapter : volume.chapters.length
    const start = Math.max(0, volumeStart)
    const end = Math.min(volume.chapters.length, volumeEnd)
    const selected = volume.chapters.slice(start, end)

    const selectedVolume = new Volume(volume.volumeName, packerInstance.catalog)
    selectedVolume.cover = volume.cover
    selectedVolume.chapters = selected
    packVolumes.push(selectedVolume)
  })

  return packVolumes
}

/**
 * 卷选择 Hook
 */
export function useVolumeSelection(totalVolumes: number) {
  const [selectedVolumes, setSelectedVolumes] = useState<Set<number>>(() => new Set())
  const [startChapter, setStartChapter] = useState(1)
  const [endChapter, setEndChapter] = useState(1)

  const toggleVolume = useCallback((volumeIdx: number) => {
    setSelectedVolumes((prev) => {
      const next = new Set(prev)
      if (next.has(volumeIdx)) {
        next.delete(volumeIdx)
      }
      else {
        next.add(volumeIdx)
      }
      return next
    })
  }, [])

  const selectAllVolumes = useCallback(() => {
    const all = new Set<number>()
    for (let i = 0; i < totalVolumes; i++) {
      all.add(i)
    }
    setSelectedVolumes(all)
  }, [totalVolumes])

  const clearSelection = useCallback(() => {
    setSelectedVolumes(new Set())
  }, [])

  const isVolumeSelected = useCallback(
    (volumeIdx: number) => selectedVolumes.has(volumeIdx),
    [selectedVolumes],
  )

  return {
    selectedVolumes,
    startChapter,
    setStartChapter,
    endChapter,
    setEndChapter,
    toggleVolume,
    selectAllVolumes,
    clearSelection,
    isVolumeSelected,
  }
}
