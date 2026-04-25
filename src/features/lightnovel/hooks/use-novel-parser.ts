/**
 * 轻小说解析 Hook
 */

import type { LightNovelInfo } from "../services/types"
import { useCallback, useState } from "react"
import { toast } from "sonner"
import { log } from "@/utils/logger"
import { LightNovelPacker } from "../services/packer/lightnovel-packer"

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
        log.lightnovel.error("Parse failed", error)
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
