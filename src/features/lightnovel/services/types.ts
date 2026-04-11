/**
 * 轻小说下载模块 - 类型定义
 * 支持哔哩轻小说和轻小说文库两个源
 */

import type { ChapterLink, VolumeLink } from "@/types/novel"

/**
 * 轻小说章节
 */
export type LightNovelChapter = ChapterLink

/**
 * 轻小说卷
 */
export type LightNovelVolume = VolumeLink & {
  cover?: string
}

/**
 * 轻小说信息
 */
export interface LightNovelInfo {
  id: string
  title: string
  author: string
  cover?: string
  status: string
  description?: string
  alias?: string
  tags?: string[]
  publisher?: string
  url?: string
  volumes: LightNovelVolume[]
  source: "bili" | "wenku"
}

/**
 * 下载进度
 */
export interface DownloadProgress {
  current: number
  total: number
  status: string
  currentChapter?: string
}

/**
 * 解析结果
 */
export interface ParseResult {
  novelInfo: LightNovelInfo
  totalChapters: number
}

/**
 * 下载任务配置
 */
export interface DownloadTaskConfig {
  novelInfo: LightNovelInfo
  selectedVolumes: Set<number>
  startChapter: number
  endChapter: number
  onProgress?: (progress: DownloadProgress) => void
}

/**
 * 解析器接口
 */
export interface INovelParser {
  parse: (input: string) => Promise<LightNovelInfo>
  parseChapterContent: (url: string) => Promise<string>
}

/**
 * 调度器配置
 */
export interface SchedulerConfig {
  delayMs?: number
  maxRetries?: number
  retryDelayMs?: number
}
