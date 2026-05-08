import type { DownloadTaskRecord } from "@/types/download-task"
import { db } from "@/lib/db"
import { log } from "@/utils/logger"

/**
 * 下载队列管理器
 * 任务持久化，支持 Service Worker 重启后恢复
 */
export class DownloadQueue {
  /**
   * 创建下载任务
   */
  static async createTask(
    novelId: string,
    source: string,
    bookTitle: string,
    chapters: Array<{ title: string, url: string }>,
  ): Promise<string> {
    const taskId = `${novelId}:${Date.now()}`

    const task: DownloadTaskRecord = {
      id: taskId,
      bookId: novelId,
      bookTitle,
      source,
      chapters: chapters.map((c, i) => ({ ...c, order: i })),
      completedChapters: 0,
      status: "pending",
      startedAt: Date.now(),
    }

    await db.downloadTasks.add(task)

    log.background.info(`Download task created: ${taskId}`)
    return taskId
  }

  /**
   * 获取待执行任务（pending 或 running）
   */
  static async getPendingTasks(): Promise<DownloadTaskRecord[]> {
    return db.downloadTasks
      .where("status")
      .equals("pending")
      .or("status")
      .equals("running")
      .toArray()
  }

  /**
   * 获取指定任务
   */
  static async getTask(taskId: string): Promise<DownloadTaskRecord | undefined> {
    return db.downloadTasks.get(taskId)
  }

  /**
   * 获取书籍的所有下载任务
   */
  static async getTasksByBookId(bookId: string): Promise<DownloadTaskRecord[]> {
    return db.downloadTasks.where("bookId").equals(bookId).toArray()
  }

  /**
   * 标记任务开始执行
   */
  static async markRunning(taskId: string): Promise<void> {
    await db.downloadTasks.update(taskId, { status: "running" })
  }

  /**
   * 更新任务进度
   */
  static async updateProgress(taskId: string, completedChapters: number): Promise<void> {
    await db.downloadTasks.update(taskId, {
      completedChapters,
      resumeFrom: completedChapters,
    })

    log.background.info(`Download progress: ${completedChapters} chapters`)
  }

  /**
   * 标记任务完成
   */
  static async markCompleted(taskId: string): Promise<void> {
    await db.downloadTasks.update(taskId, {
      status: "completed",
      completedAt: Date.now(),
    })

    log.background.info(`Download task completed: ${taskId}`)
  }

  /**
   * 标记任务失败
   */
  static async markFailed(taskId: string, error: string): Promise<void> {
    await db.downloadTasks.update(taskId, {
      status: "failed",
      error,
    })

    log.background.error(`Download task failed: ${taskId}`, error)
  }

  /**
   * 取消任务
   */
  static async cancelTask(taskId: string): Promise<void> {
    await db.downloadTasks.update(taskId, { status: "cancelled" })
  }

  /**
   * 删除任务记录
   */
  static async deleteTask(taskId: string): Promise<void> {
    await db.downloadTasks.delete(taskId)
  }

  /**
   * 清理已完成的任务（保留最近 7 天）
   */
  static async cleanupOldTasks(): Promise<void> {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    const oldCompletedTasks = await db.downloadTasks
      .where("status")
      .equals("completed")
      .filter(task => Boolean(task.completedAt && task.completedAt < sevenDaysAgo))
      .toArray()

    for (const task of oldCompletedTasks) {
      await db.downloadTasks.delete(task.id)
    }

    log.background.info(`Cleaned up ${oldCompletedTasks.length} old download tasks`)
  }
}
