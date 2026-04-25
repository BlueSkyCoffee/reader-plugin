import type { Chapter } from "@/types/novel"
import { defineBackground } from "#imports"
import { browser } from "wxt/browser"
import { ParserProvider } from "@/features/lightnovel/services"
import { db } from "@/lib/db"
import { registerHandlers } from "@/lib/messaging"
import { log } from "@/utils/logger"

export default defineBackground({
  type: "module",
  main: () => {
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
        const fetchChapter = await ParserProvider.getChapterFetcher(data.source as "bili" | "wenku")

        for (const [chapterIndex, chapter] of data.chapters.entries()) {
          try {
            const content = await fetchChapter(chapter.url)
            await db.chapters.add({
              bookId: data.novelId,
              title: chapter.title,
              content,
              url: chapter.url,
              order: chapterIndex,
            } as Chapter)

            await new Promise(resolve => setTimeout(resolve, 800))
          }
          catch (error) {
            log.background.error(`Download chapter failed: ${chapter.title}`, error)
          }
        }
      },
    })
  },
})
