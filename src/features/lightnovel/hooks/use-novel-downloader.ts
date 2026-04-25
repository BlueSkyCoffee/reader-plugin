/**
 * 轻小说下载 Hook
 */

import type { LightNovelPacker } from "../services/packer/lightnovel-packer"
import type { DownloadProgress, DownloadTaskConfig } from "../services/types"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { log } from "@/utils/logger"
import { PackArgument, Volume } from "../services/packer/types"

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
        log.lightnovel.error("Download failed", error)
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
