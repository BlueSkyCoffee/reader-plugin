/**
 * 下载任务记录
 * 用于跟踪下载进度和断点续传
 */
export interface DownloadTaskRecord {
  id: string
  bookId: string
  bookTitle: string
  source: string
  chapters: Array<{
    title: string
    url: string
    order: number
  }>
  completedChapters: number
  status: "pending" | "running" | "completed" | "failed" | "cancelled"
  startedAt: number
  completedAt?: number
  error?: string
  /**
   * 断点续传位置
   */
  resumeFrom?: number
}
