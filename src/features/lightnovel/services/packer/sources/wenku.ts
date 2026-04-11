import type { LightNovelSource } from "./base"
import { Scheduler } from "../../scheduler"
import { removeElements, unwrap } from "../html-util"
import { httpGetBytes, httpGetString } from "../http-util"
import { Catalog, Chapter, Novel, Volume } from "../types"
import { resolveBaseUrl } from "../url-util"
import { baseHtml } from "./base"

const domain = "https://www.wenku8.net"
const exp1 = /wenku8\.net\/book\/(\d+)/
const exp2 = /wenku8\.net\/novel\/\d+\/(\d+)\//

const scheduler = new Scheduler(20, 60000)

function getDecoder() {
  try {
    return new TextDecoder("gbk")
  }
  catch {
    return new TextDecoder("utf-8")
  }
}

export class WenkuNovelSource implements LightNovelSource {
  name = "轻小说文库"
  sourceUrl = `${domain}/login.php`

  supportUrl(url: string) {
    return exp1.test(url) || exp2.test(url)
  }

  async getNovel(url: string): Promise<Novel> {
    const id = this.getId(url)
    const infoUrl = `${domain}/book/${id}.htm`
    const html = await this.httpGet(infoUrl)
    const doc = new DOMParser().parseFromString(html, "text/html")
    const novel = new Novel()
    novel.id = id
    novel.url = infoUrl
    novel.title = doc.querySelector("#content table:nth-child(1) span b")?.textContent?.trim() ?? ""
    novel.coverUrl = doc.querySelector("#content table img")?.getAttribute("src") ?? undefined
    const details = Array.from(doc.querySelectorAll("#content table:nth-child(1) tr:nth-child(2) td"))
    novel.status = details[2]?.textContent?.replace("文章状态：", "").trim() ?? ""
    novel.author = details[1]?.textContent?.replace("小说作者：", "").trim() ?? ""
    const td = doc.querySelectorAll("#content table")[2]?.querySelectorAll("td")[1]
    if (td) {
      const tags = td.querySelector("span")?.textContent?.replace("作品Tags：", "").trim() ?? ""
      novel.tags = tags ? tags.split(" ").filter(Boolean) : undefined
      novel.description = td.querySelectorAll("span")?.item(1)?.textContent?.trim()
    }
    const catalogUrl = doc.querySelector("legend + div > a")?.getAttribute("href") ?? ""
    novel.catalogUrl = catalogUrl.startsWith("http")
      ? catalogUrl
      : `${domain}${catalogUrl.startsWith("/") ? "" : "/"}${catalogUrl}`
    return novel
  }

  async getNovelCatalog(novel: Novel): Promise<Catalog> {
    if (!novel.catalogUrl) {
      throw new Error("Catalog url not found")
    }
    const url = novel.catalogUrl
    const prefix = resolveBaseUrl(url, "./")
    const html = await this.httpGet(url)
    const doc = new DOMParser().parseFromString(html, "text/html")
    const catalog = new Catalog(novel)
    let volume: Volume | null = null
    const tds = Array.from(doc.querySelectorAll("table td"))
    tds.forEach((td) => {
      const className = td.getAttribute("class")
      if (className === "vcss") {
        if (volume) {
          catalog.volumes.push(volume)
        }
        volume = new Volume(td.textContent?.trim() ?? "", catalog)
      }
      else if (className === "ccss" && volume) {
        const link = td.querySelector("a")
        if (!link)
          return
        const href = link.getAttribute("href")
        const chapter = new Chapter(
          link.textContent?.trim() ?? "",
          `${prefix}/${href}`,
          volume,
        )
        if (chapter.chapterName === "插图") {
          volume.chapters.unshift(chapter)
        }
        else {
          volume.chapters.push(chapter)
        }
      }
    })
    if (volume) {
      catalog.volumes.push(volume)
    }
    return catalog
  }

  async getNovelChapter(chapter: Chapter): Promise<Document> {
    return this.retry(async () => this.getNovelChapterInner(chapter), 10, 300)
  }

  async getImage(src: string): Promise<Uint8Array> {
    return scheduler.run(() => httpGetBytes(src))
  }

  private async getNovelChapterInner(chapter: Chapter): Promise<Document> {
    const url = chapter.chapterUrl!
    const html = await this.httpGet(url)
    const doc = new DOMParser().parseFromString(html, "text/html")
    const outerHtml = doc.documentElement.outerHTML
    if (outerHtml.includes("Cloudflare") && outerHtml.includes("Ray ID")) {
      throw new Error("Cloudflare Error")
    }
    const content = doc.querySelector("#content")
    if (!content) {
      throw new Error("运行出错，请提交Issues并上传日志文件")
    }
    removeElements(Array.from(content.querySelectorAll("#contentdp, br")))
    return this.wrapDocument(content)
  }

  private wrapDocument(content: Element): Document {
    const doc = new DOMParser().parseFromString(baseHtml, "text/html")
    const nodes = Array.from(content.childNodes)
    nodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim() ?? ""
        if (text) {
          const element = doc.createElement("p")
          element.textContent = text
          doc.body?.append(element)
        }
      }
      else {
        doc.body?.append(node.cloneNode(true))
      }
    })
    Array.from(doc.querySelectorAll("a")).forEach((link) => {
      unwrap(link)
    })
    return doc
  }

  private getId(url: string) {
    const match1 = exp1.exec(url)
    if (match1?.[1]) {
      return match1[1]
    }
    const match2 = exp2.exec(url)
    if (match2?.[1]) {
      return match2[1]
    }
    throw new Error(`Unsupported url: ${url}`)
  }

  private async httpGet(url: string): Promise<string> {
    return scheduler.run(async (controller) => {
      const html = await httpGetString(url, {
        decoder: getDecoder(),
      })
      if (html.includes("rate limited")) {
        controller.pause()
        await new Promise(resolve => setTimeout(resolve, 10000))
        controller.resume()
        return this.httpGet(url)
      }
      return html
    })
  }

  private async retry<T>(fn: () => Promise<T>, maxAttempts: number, delayMs: number): Promise<T> {
    let lastError: unknown
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      }
      catch (error) {
        lastError = error
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delayMs))
        }
      }
    }
    throw lastError
  }
}
