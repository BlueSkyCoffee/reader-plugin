import type { ExtensionProtocolMap } from "@/lib/contracts/messages"
import type { DownloadTaskRecord } from "@/types/download-task"
import type { Chapter } from "@/types/novel"
import { defineBackground } from "#imports"
import { browser } from "wxt/browser"
import { ParserProvider } from "@/features/lightnovel/services"
import { BroadcastService } from "@/lib/broadcast"
import { db } from "@/lib/db"
import { DownloadQueue } from "@/lib/download-queue"
import { registerHandlers } from "@/lib/messaging"
import { showDownloadCompleteNotification } from "@/lib/notifications"
import { log } from "@/utils/logger"

type MessageHandlers = {
  [K in keyof ExtensionProtocolMap]: ExtensionProtocolMap[K] extends (data: infer D) => Promise<infer R>
    ? (data: D) => Promise<R>
    : () => Promise<void>
}

/**
 * 恢复 Service Worker 重启前的未完成任务
 */
async function resumePendingTasks() {
  const pendingTasks = await DownloadQueue.getPendingTasks()

  for (const task of pendingTasks) {
    if (task.status === "running") {
      log.background.info(`Resuming download task: ${task.id}`)
      void continueDownload(task)
    }
    else if (task.status === "pending") {
      log.background.info(`Found pending download task: ${task.id}`)
    }
  }
}

/**
 * 执行下载任务
 */
async function executeDownload(
  taskId: string,
  data: { novelId: string, source: string, chapters: Array<{ title: string, url: string }> },
) {
  const fetchChapter = await ParserProvider.getChapterFetcher(data.source as "bili" | "wenku")

  await DownloadQueue.markRunning(taskId)

  const total = data.chapters.length

  try {
    for (const [chapterIndex, chapter] of data.chapters.entries()) {
      const task = await DownloadQueue.getTask(taskId)
      if (!task || task.status === "cancelled") {
        log.background.info(`Download cancelled: ${taskId}`)
        return
      }

      try {
        const content = await fetchChapter(chapter.url)

        await db.chapters.add({
          bookId: data.novelId,
          title: chapter.title,
          content,
          url: chapter.url,
          order: chapterIndex,
          fetchStatus: "fetched",
          contentHash: simpleHash(content),
        } as Chapter)

        await DownloadQueue.updateProgress(taskId, chapterIndex + 1)

        const delay = 300 + Math.random() * 500
        await new Promise(resolve => setTimeout(resolve, delay))
      }
      catch (error) {
        log.background.error(`Chapter failed: ${chapter.title}`, error)
      }
    }

    await DownloadQueue.markCompleted(taskId)

    void BroadcastService.emit("download-complete", {
      taskId,
      bookId: data.novelId,
      totalChapters: total,
    })

    await showDownloadCompleteNotification(taskId.split(":")[0], total)
  }
  catch (error) {
    await DownloadQueue.markFailed(taskId, String(error))

    void BroadcastService.emit("download-failed", {
      taskId,
      bookId: data.novelId,
      error: String(error),
    })
  }
}

/**
 * 从断点继续下载
 */
async function continueDownload(task: DownloadTaskRecord) {
  const resumeFrom = task.resumeFrom ?? 0
  const remainingChapters = task.chapters.slice(resumeFrom)

  if (remainingChapters.length === 0) {
    await DownloadQueue.markCompleted(task.id)
    return
  }

  log.background.info(`Continuing download from chapter ${resumeFrom}`)

  await DownloadQueue.markRunning(task.id)

  const fetchChapter = await ParserProvider.getChapterFetcher(task.source as "bili" | "wenku")

  for (const [index, chapter] of remainingChapters.entries()) {
    const currentTask = await DownloadQueue.getTask(task.id)
    if (!currentTask || currentTask.status === "cancelled") {
      return
    }

    try {
      const content = await fetchChapter(chapter.url)

      await db.chapters.add({
        bookId: task.bookId,
        title: chapter.title,
        content,
        url: chapter.url,
        order: resumeFrom + index,
        fetchStatus: "fetched",
        contentHash: simpleHash(content),
      } as Chapter)

      await DownloadQueue.updateProgress(task.id, resumeFrom + index + 1)

      const delay = 300 + Math.random() * 500
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    catch (error) {
      log.background.error(`Chapter failed: ${chapter.title}`, error)
    }
  }

  await DownloadQueue.markCompleted(task.id)
  await showDownloadCompleteNotification(task.bookId, task.chapters.length)
}

function simpleHash(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).slice(0, 8)
}

export default defineBackground({
  type: "module",
  main: () => {
    // 启动时恢复未完成的下载任务
    void resumePendingTasks()

    registerHandlers({
      openOptionsPage: () => browser.runtime.openOptionsPage(),

      fetchHtml: async (data) => {
        const { url, method = "get", data: body, headers } = data
        const requestInit: RequestInit = {
          method: method.toUpperCase(),
          headers: headers || {},
        }

        if (method === "post" && body) {
          requestInit.body = body

          if (!Object.keys(requestInit.headers || {}).some(key => key.toLowerCase() === "content-type")) {
            requestInit.headers = {
              ...requestInit.headers,
              "Content-Type": "application/x-www-form-urlencoded",
            }
          }
        }

        const response = await fetch(url, requestInit)
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`)
        }

        return response.text()
      },

      fetchNovelMetadata: (data) => {
        return ParserProvider.fetchMetadata(data.url)
      },

      fetchNovelCatalog: (data) => {
        return ParserProvider.fetchCatalog(data.source as "bili" | "wenku", data.id, data.catalogUrl)
      },

      startDownload: async (data) => {
        const taskId = await DownloadQueue.createTask(
          data.novelId,
          data.source,
          data.bookTitle,
          data.chapters,
        )

        void executeDownload(taskId, data)

        return taskId
      },

      getDownloadStatus: async (data) => {
        if (data.taskId) {
          const task = await DownloadQueue.getTask(data.taskId)
          return task ? [task] : []
        }
        return DownloadQueue.getPendingTasks()
      },

      cancelDownload: async (data) => {
        await DownloadQueue.cancelTask(data.taskId)
      },

      keepAlive: async (data) => {
        return { received: data.timestamp }
      },
    } as MessageHandlers)
  },
})
