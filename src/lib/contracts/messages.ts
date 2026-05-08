import type { ReaderSession } from "@/state/store"
import type { DownloadTaskRecord } from "@/types/download-task"
import type { Volume } from "@/types/novel"

// === 基础消息类型 ===

export interface NovelMetadataMessage {
  id: string
  title: string
  author: string
  cover?: string
  catalogUrl?: string
  source: string
}

export interface FetchHtmlMessage {
  url: string
  method?: "get" | "post"
  data?: BodyInit | null
  headers?: Record<string, string>
}

export interface StartDownloadMessage {
  novelId: string
  bookTitle: string
  source: string
  chapters: Array<{ title: string, url: string }>
}

// === 新增：下载任务相关 ===

export interface GetDownloadStatusMessage {
  taskId?: string
}

export interface CancelDownloadMessage {
  taskId: string
}

// === 新增：阅读会话同步 ===

export interface UpdateReaderSessionMessage {
  session: Partial<ReaderSession>
}

// === 新增：心跳保持 ===

export interface KeepAliveMessage {
  timestamp: number
}

// === 新增：广播事件类型 ===

export type BroadcastEventType
  = | "settings-changed"
    | "session-changed"
    | "download-progress"
    | "download-complete"
    | "download-failed"

export interface BroadcastMessage<T = unknown> {
  type: BroadcastEventType
  data: T
}

// === 完整协议映射（Background 处理） ===

export interface ExtensionProtocolMap {
  // 基础功能
  openOptionsPage: () => void
  fetchNovelMetadata: (data: { url: string }) => Promise<NovelMetadataMessage>
  fetchNovelCatalog: (data: {
    source: string
    id: string
    catalogUrl?: string
  }) => Promise<Volume[]>

  // 下载任务（增强）
  startDownload: (data: StartDownloadMessage) => Promise<string>
  getDownloadStatus: (data: GetDownloadStatusMessage) => Promise<DownloadTaskRecord[]>
  cancelDownload: (data: CancelDownloadMessage) => Promise<void>

  // 通用工具
  fetchHtml: (data: FetchHtmlMessage) => Promise<string>

  // 心跳保持（保持 Service Worker 活跃）
  keepAlive: (data: KeepAliveMessage) => Promise<{ received: number }>
}

// === Content Script 专用协议（Popup/Options -> Content） ===

export interface ContentProtocolMap {
  showReader: (data: { bookId: string, chapterIndex?: number, scrollPosition?: number }) => void
  hideReader: () => void
  updateSession: (data: Partial<ReaderSession>) => void
  getReaderState: () => Promise<{
    visible: boolean
    session: ReaderSession
  }>
}
