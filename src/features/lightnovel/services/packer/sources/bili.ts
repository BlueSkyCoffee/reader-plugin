import type { LightNovelSource } from "./base"
import { Scheduler } from "../../scheduler"
import { removeElements, removeElementsByPattern, removeLineBreak } from "../html-util"
import { httpGetBytes, httpGetString } from "../http-util"
import { AsyncLock } from "../lock"
import { Catalog, Chapter, Novel, Volume } from "../types"
import { baseHtml } from "./base"
import { BiliNovelHelper } from "./bili-secret"

const chapterUrlExp = /(?:linovelib|bilinovel)\.com\/(?:novel|download)\/(\d+)/
const domain = "https://www.bilinovel.com"

const scheduler = new Scheduler(15, 60000)
const imageScheduler = new Scheduler(10, 1000)
const lock = new AsyncLock()

let warnedVersionMismatch = false
let _secretMap: Record<string, string> = {}

export class BiliNovelSource implements LightNovelSource {
  static async init() {
    _secretMap = await BiliNovelHelper.getSecretMap()
  }

  name = "哔哩轻小说"
  sourceUrl = domain

  supportUrl(url: string) {
    return chapterUrlExp.test(url)
  }

  async getNovel(url: string): Promise<Novel> {
    const id = this.getId(url)
    const infoUrl = `${domain}/novel/${id}.html`
    const html = await httpGetString(infoUrl, {
      credentials: "include",
    })
    const doc = new DOMParser().parseFromString(html, "text/html")
    const novel = new Novel()
    novel.id = id
    novel.url = url
    novel.title = doc.querySelector(".book-title")?.textContent?.trim() ?? ""
    const backup = doc.querySelector(".backupname .bkname-body.gray")?.textContent?.trim()
    if (backup) {
      novel.alias = backup
    }
    novel.coverUrl = doc.querySelector(".book-layout img")?.getAttribute("src") ?? undefined
    novel.tags = Array.from(doc.querySelectorAll(".book-cell .book-meta span em")).map(e => e.textContent?.trim() ?? "").filter(Boolean)
    novel.publisher = doc.querySelector(".tag-small.orange")?.textContent?.trim() ?? undefined
    novel.status = doc.querySelector(".book-cell .book-meta+.book-meta")?.textContent?.trim() ?? ""
    novel.author = doc.querySelector(".book-rand-a span")?.textContent?.trim() ?? ""
    novel.description = doc.querySelector("#bookSummary content")?.textContent?.trim() ?? undefined
    return novel
  }

  async getNovelCatalog(novel: Novel): Promise<Catalog> {
    const url = `${domain}/novel/${novel.id}/catalog`
    const html = await httpGetString(url, {
      credentials: "include",
    })
    const doc = new DOMParser().parseFromString(html, "text/html")
    const catalog = new Catalog(novel)

    this.replaceImageSrc(doc.body!)
    let volume: Volume | null = null
    if (!doc.querySelector(".chapter-bar")) {
      volume = new Volume("", catalog)
    }

    const lis = Array.from(doc.querySelectorAll(".volume-chapters > li"))
    if (lis.length === 0) {
      throw new Error("目录获取为空")
    }

    lis.forEach((li) => {
      if (li.classList.contains("chapter-bar")) {
        if (volume) {
          catalog.volumes.push(volume)
        }
        volume = new Volume(li.textContent?.trim() ?? "", catalog)
      }
      else if (li.classList.contains("volume-cover")) {
        const cover = li.querySelector("a img")?.getAttribute("src") ?? undefined
        if (volume) {
          volume.cover = cover
        }
      }
      else if (li.classList.contains("jsChapter")) {
        const link = li.querySelector("a")
        if (!link || !volume)
          return
        const name = link.textContent?.trim() ?? ""
        let href = link.getAttribute("href") ?? undefined
        if (href && href.includes("javascript")) {
          href = undefined
        }
        else if (href) {
          href = `${domain}${href}`
        }
        const chapter = new Chapter(name, href, volume)
        volume.chapters.push(chapter)
      }
    })

    if (volume) {
      catalog.volumes.push(volume)
    }
    return catalog
  }

  async getNovelChapter(chapter: Chapter): Promise<Document> {
    const doc = new DOMParser().parseFromString(baseHtml, "text/html")
    chapter.chapterUrl ||= await this.getChapterUrl(chapter)
    if (!chapter.chapterUrl) {
      throw new Error("Empty chapter url")
    }

    let nextPageUrl: string | null = chapter.chapterUrl
    do {
      const page = await this.getChapterPage(nextPageUrl)
      if (page.title && page.title !== chapter.chapterName && !page.title.includes("〇")) {
        chapter.chapterName = page.title
      }
      page.contents.forEach((node) => {
        doc.body?.append(node)
      })
      nextPageUrl = page.nextPageUrl
    } while (nextPageUrl)

    if (doc.body) {
      removeLineBreak(doc.body)
      this.replaceImageSrc(doc.body)
    }
    return doc
  }

  async getImage(src: string): Promise<Uint8Array> {
    if (src.startsWith("data:image")) {
      const base64 = src.split(",")[1] ?? ""
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes
    }
    if (!src.startsWith("http")) {
      src = `${domain}/${src}`
    }
    src = src.replace("https://https://", "https://").replace(/\uD835\uDE23/g, "b")
    return imageScheduler.run(() => {
      return httpGetBytes(src, {
        credentials: "include",
      })
    })
  }

  private getId(url: string) {
    const match = chapterUrlExp.exec(url)
    if (!match || !match[1]) {
      throw new Error(`Unsupported url: ${url}`)
    }
    return match[1]
  }

  private async getChapterUrl(chapter: Chapter): Promise<string | null> {
    if (chapter.chapterUrl) {
      return chapter.chapterUrl
    }
    const catalog = chapter.volume.catalog
    const nextChapter = this.getNextChapter(catalog, chapter)
    if (nextChapter?.chapterUrl) {
      const page = await this.getChapterPage(nextChapter.chapterUrl)
      if (page.prevChapterUrl) {
        return page.prevChapterUrl
      }
    }
    const prevChapter = this.getPrevChapter(catalog, chapter)
    if (prevChapter?.chapterUrl) {
      let page = await this.getChapterPage(prevChapter.chapterUrl)
      for (let i = 0; i < 20; i++) {
        const next = page.nextPageUrl
        if (!next) {
          return page.nextChapterUrl ?? null
        }
        page = await this.getChapterPage(next)
      }
    }
    return null
  }

  private getPrevChapter(catalog: Catalog, chapter: Chapter) {
    const allChapters = catalog.volumes.flatMap(volume => volume.chapters)
    const pos = allChapters.indexOf(chapter)
    if (pos < 1)
      return null
    return allChapters[pos - 1]
  }

  private getNextChapter(catalog: Catalog, chapter: Chapter) {
    const allChapters = catalog.volumes.flatMap(volume => volume.chapters)
    const pos = allChapters.indexOf(chapter)
    if (pos < 0 || pos >= allChapters.length - 1)
      return null
    return allChapters[pos + 1]
  }

  private async getChapterPage(url: string): Promise<ChapterPage> {
    const html = await this.httpGetString(url)
    const doc = new DOMParser().parseFromString(html, "text/html")
    const title = url.includes("_") ? null : doc.querySelector("#atitle")?.textContent?.trim() ?? null
    const content = doc.querySelector("#acontent") || doc.querySelector(".bcontent")
    if (!content) {
      throw new Error("运行出错，请提交Issues并上传日志文件")
    }

    const match = /url_previous:'(.*?)',url_next:'(.*?)'/.exec(doc.documentElement.outerHTML)
    const prevUrl = match?.[1]
    const nextUrl = match?.[2]
    const prev = doc.querySelector("#footlink a:first-child")
    const next = doc.querySelector("#footlink a:last-child")
    let prevPage: string | null = null
    let nextPage: string | null = null
    let prevChapter: string | null = null
    let nextChapter: string | null = null

    if (prev && (prev.textContent === "上一页" || prev.textContent === "上一頁") && prevUrl) {
      prevPage = `${domain}${prevUrl}`
    }
    else if (prev && prevUrl) {
      prevChapter = `${domain}${prevUrl}`
    }
    if (next && (next.textContent === "下一页" || next.textContent === "下一頁") && nextUrl) {
      nextPage = `${domain}${nextUrl}`
    }
    else if (next && nextUrl) {
      nextChapter = `${domain}${nextUrl}`
    }

    removeElements(Array.from(content.querySelectorAll("div, ins, figure, fig, br, script, .tp, .bd")))
    removeElementsByPattern(content, "[a-z]\\d{4}", { matchId: true })

    const params = await this.getShuffleParams(doc)
    if (params) {
      this.shuffleContent(content, params)
    }

    return {
      title,
      contents: Array.from(content.children).map(node => node.cloneNode(true) as Element),
      prevPageUrl: prevPage,
      nextPageUrl: nextPage,
      prevChapterUrl: prevChapter,
      nextChapterUrl: nextChapter,
    }
  }

  private async getShuffleParams(doc: Document): Promise<ShuffleParams | null> {
    return lock.run(async () => {
      const script = Array.from(doc.querySelectorAll("script")).find(s => s.getAttribute("src")?.includes("chapterlog.js?v"))
      if (!script) {
        return null
      }
      const chapterIdMatch = /chapterid:'(\d+)'/.exec(doc.documentElement.outerHTML)
      const chapterId = chapterIdMatch ? Number.parseInt(chapterIdMatch[1]) : null
      const jsSrc = script.getAttribute("src") ?? ""
      const currentVersion = "v1006c1.3"
      const matchedVersion = jsSrc.substring(jsSrc.lastIndexOf("v"))
      if (currentVersion !== matchedVersion && !warnedVersionMismatch) {
        warnedVersionMismatch = true
        console.warn(`[警告]: chapterlog版本号不匹配，当前版本: ${currentVersion}, 实际版本: ${matchedVersion}, 可能导致章节内容顺序错乱`)
      }
      if (!chapterId) {
        return null
      }
      return {
        fixedLength: 20,
        seed: chapterId * 126 + 232,
        a: 9302,
        c: 49397,
        mod: 233280,
      }
    })
  }

  private shuffleContent(content: Element, params: ShuffleParams) {
    const pElements = Array.from(content.querySelectorAll("p")).filter(p => p.textContent?.trim())
    if (pElements.length === 0)
      return

    const fixed: number[] = []
    const shuffled: number[] = []
    for (let i = 0; i < pElements.length; i++) {
      if (i < params.fixedLength) {
        fixed.push(i)
      }
      else {
        shuffled.push(i)
      }
    }
    if (pElements.length > params.fixedLength) {
      this.shuffleArray(shuffled, params)
    }
    const indices = [...fixed, ...shuffled]
    const mapped: Element[] = Array.from({ length: pElements.length })
    for (let i = 0; i < pElements.length; i++) {
      mapped[indices[i]] = pElements[i]
    }
    let replacedIndex = 0
    Array.from(content.children).forEach((node) => {
      if (node.tagName.toLowerCase() === "p" && node.textContent?.trim()) {
        const nextParagraph = mapped[replacedIndex++]
        if (nextParagraph) {
          content.replaceChild(nextParagraph.cloneNode(true), node)
        }
      }
    })
  }

  private shuffleArray(arr: number[], params: ShuffleParams) {
    let seed = params.seed
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (seed * params.a + params.c) % params.mod
      const j = Math.floor((seed / params.mod) * (i + 1))
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
    }
    return arr
  }

  private replaceImageSrc(element: Element) {
    const images = Array.from(element.querySelectorAll("img"))
    images.forEach((image) => {
      let src = image.getAttribute("data-src") || image.getAttribute("src") || undefined
      if (src) {
        if (src.includes("<")) {
          image.remove()
          return
        }
        if (src.startsWith("//")) {
          src = `https:${src}`
        }
        image.setAttribute("src", src)
      }
      this.removeImageAttr(image)
      this.addAlt(image)
    })
  }

  private removeImageAttr(image: Element) {
    const attrs = [
      "alt",
      "class",
      "dir",
      "height",
      "id",
      "ismap",
      "lang",
      "longdesc",
      "style",
      "title",
      "usemap",
      "width",
      "src",
      "xml:lang",
    ]
    Array.from(image.attributes).forEach((attr) => {
      if (!attrs.includes(attr.name)) {
        image.removeAttribute(attr.name)
      }
    })
  }

  private addAlt(image: Element, alt?: string) {
    image.setAttribute("alt", alt ?? "")
  }

  private async httpGetString(url: string) {
    return scheduler.run(async (controller) => {
      const html = await httpGetString(url, {
        credentials: "include",
      })
      if (html.includes("Cloudflare to restrict access") || html.includes("503 Service Temporarily Unavailable")) {
        controller.pause()
        await new Promise(resolve => setTimeout(resolve, 10000))
        controller.resume()
        return this.httpGetString(url)
      }
      return html
    })
  }
}

interface ShuffleParams {
  fixedLength: number
  seed: number
  a: number
  c: number
  mod: number
}

interface ChapterPage {
  title: string | null
  contents: Element[]
  prevPageUrl: string | null
  nextPageUrl: string | null
  prevChapterUrl: string | null
  nextChapterUrl: string | null
}
