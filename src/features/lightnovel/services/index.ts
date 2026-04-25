/**
 * 轻小说下载模块 - 主导出文件
 */

// Hooks 导出（从 hooks 目录）
export { useNovelDownloader, useNovelParser, useVolumeSelection } from "../hooks"

// 下载管理器导出
export { LightNovelDownloader } from "./downloader"
export {
  cleanHtmlContent,
  escapeHtml,
  extractParagraphs,
  extractPlainText,
  normalizeHtmlContent,
  paragraphsToHtml,
  unescapeHtml,
} from "./html-cleaner"
export { LightNovelPacker } from "./packer/lightnovel-packer"

export { PackArgument } from "./packer/types"
export type { PackProgress, PackResult } from "./packer/types"
// 解析器导出
export { BaseNovelParser } from "./parser/base"
export { BiliNovelParser } from "./parser/bili"
export { ParserProvider } from "./parser/provider"

export type { Chapter, Novel, Volume } from "./parser/types"

export { WenkuNovelParser } from "./parser/wenku"
// 工具导出
export { RequestScheduler } from "./scheduler"
// 类型导出
export type {
  DownloadProgress,
  DownloadTaskConfig,
  INovelParser,
  LightNovelChapter,
  LightNovelInfo,
  LightNovelVolume,
  ParseResult,
  SchedulerConfig,
} from "./types"

export {
  buildBiliChapterUrl,
  buildBiliNovelUrl,
  buildWenkuNovelUrl,
  extractBiliNovelId,
  extractWenkuNovelId,
  getUrlDomain,
  isBiliUrl,
  isValidBiliNovelId,
  isValidWenkuNovelId,
  isWenkuUrl,
  normalizeUrl,
} from "./url-parser"
