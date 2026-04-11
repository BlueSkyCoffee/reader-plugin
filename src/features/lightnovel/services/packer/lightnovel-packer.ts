import type { LightNovelSource } from "./sources"
import type { Catalog, Chapter, Novel, PackArgument, PackProgress, PackResult, Volume } from "./types"
import { saveAs } from "file-saver"
import { getImageInfo, LightNovelCoverDetector, UnsupportedImageError } from "./cover-detector"
import { jpeg } from "./epub/media-types"
import { NavPoint } from "./epub/navigator"
import { EpubPacker } from "./epub/packer"
import { wrapDuoKanImage } from "./html-util"
import { Sequence } from "./sequence"
import { BiliNovelSource } from "./sources/bili"
import { WenkuNovelSource } from "./sources/wenku"
import { getSeriesIndex } from "./volume-util"

const chapterTitleCss = `.chapter-title {
  margin-top: 0.5em!important;
  font-size: 1.25em!important;
  font-weight: 800!important;
  text-align: center!important;
}`

export class LightNovelPacker {
  static sources: LightNovelSource[] = [
    new BiliNovelSource(),
    new WenkuNovelSource(),
  ]

  url: string
  source: LightNovelSource
  novel!: Novel
  catalog!: Catalog

  private imageSequence = new Sequence()
  private chapterSequence = new Sequence()
  private paused = false
  private stopped = false

  private constructor(source: LightNovelSource, url: string) {
    this.source = source
    this.url = url
  }

  static fromUrl(url: string) {
    for (const source of LightNovelPacker.sources) {
      if (source.supportUrl(url)) {
        return new LightNovelPacker(source, url)
      }
    }
    throw new Error(`Unsupported url: ${url}`)
  }

  async init(options: {
    novelCallback?: (novel: Novel) => void
    catalogCallback?: (catalog: Catalog) => void
  } = {}) {
    this.novel = await this.getNovel()
    options.novelCallback?.(this.novel)
    this.catalog = await this.getCatalog()
    options.catalogCallback?.(this.catalog)
    return this.novel
  }

  async getNovel() {
    this.novel = await this.source.getNovel(this.url)
    return this.novel
  }

  async getCatalog() {
    this.catalog = await this.source.getNovelCatalog(this.novel)
    return this.catalog
  }

  async pack(arg: PackArgument, progress?: (progress: PackProgress) => void): Promise<PackResult[]> {
    this.stopped = false
    const results: PackResult[] = []
    if (!arg.combineVolume) {
      for (const volume of arg.packVolumes) {
        this.imageSequence.reset()
        this.chapterSequence.reset()
        results.push(await this.packVolume(volume, arg.addChapterTitle, progress))
      }
    }
    else {
      results.push(await this.combineVolume(arg, progress))
    }
    return results
  }

  async packAndDownload(arg: PackArgument, progress?: (progress: PackProgress) => void) {
    const results = await this.pack(arg, progress)
    results.forEach((result) => {
      saveAs(result.blob, result.fileName)
    })
  }

  pause() {
    this.paused = true
  }

  resume() {
    this.paused = false
  }

  stop() {
    this.stopped = true
    this.paused = false
  }

  private async packVolume(volume: Volume, addChapterTitle: boolean, progress?: (progress: PackProgress) => void): Promise<PackResult> {
    progress?.({ current: 0, total: volume.chapters.length, status: "preparing", currentVolume: volume.volumeName })
    const packer = new EpubPacker()
    packer.docTitle = this.buildDocTitle(volume)
    packer.creator = volume.catalog.novel.author
    packer.source = this.novel.url
    packer.publisher = this.novel.publisher
    packer.subjects = this.novel.tags ?? []
    packer.description = this.novel.description
    const seriesIndex = getSeriesIndex(volume.volumeName)
    if (seriesIndex !== null && seriesIndex !== undefined) {
      packer.calibreSeries = this.novel.title
      packer.calibreSeriesIndex = seriesIndex
    }

    const detector = new LightNovelCoverDetector()
    if (addChapterTitle) {
      packer.addStylesheet({ name: "OEBPS/styles/style.css", content: chapterTitleCss })
    }

    let current = 0
    for (const chapter of volume.chapters) {
      await this.waitIfPaused()
      current += 1
      progress?.({
        current,
        total: volume.chapters.length,
        status: "downloading",
        currentChapter: chapter.chapterName,
        currentVolume: volume.volumeName,
      })
      const doc = await this.resolveChapter(chapter, packer, addChapterTitle, detector)
      this.addTitle(doc, chapter.chapterName)
      let html = this.closeTag(doc)
      html = this.appendXmlDeclare(html)
      packer.addChapter({
        name: `OEBPS/chapter${String(this.chapterSequence.next).padStart(6, "0")}.xhtml`,
        title: chapter.chapterName,
        chapterContent: html,
      })
    }

    await this.resolveCover(volume, packer, detector)

    progress?.({
      current: volume.chapters.length,
      total: volume.chapters.length,
      status: "packing",
      currentVolume: volume.volumeName,
    })

    const blob = await packer.pack()
    const fileName = this.getEpubFileName(volume)
    progress?.({
      current: volume.chapters.length,
      total: volume.chapters.length,
      status: "completed",
      currentVolume: volume.volumeName,
    })
    return { fileName, blob }
  }

  private async combineVolume(arg: PackArgument, progress?: (progress: PackProgress) => void): Promise<PackResult> {
    this.imageSequence.reset()
    this.chapterSequence.reset()
    const packer = new EpubPacker()
    packer.docTitle = this.novel.title
    packer.creator = this.novel.author
    packer.source = this.novel.url
    packer.publisher = this.novel.publisher
    packer.subjects = this.novel.tags ?? []
    packer.description = this.novel.description

    if (this.novel.coverUrl) {
      await this.waitIfPaused()
      const coverData = await this.getSingleImage(this.novel.coverUrl)
      if (coverData.length > 0) {
        let info: ReturnType<typeof getImageInfo> | null = null
        try {
          info = getImageInfo(coverData)
        }
        catch {
          info = null
        }
        const coverName = `images/${String(this.imageSequence.next).padStart(6, "0")}.jpg`
        packer.addImage({
          name: `OEBPS/${coverName}`,
          data: coverData,
          mediaType: info?.mimeType ?? jpeg,
        })
        packer.cover = { href: coverName, mediaType: info?.mimeType ?? jpeg }
      }
    }

    if (arg.addChapterTitle) {
      packer.addStylesheet({ name: "OEBPS/styles/style.css", content: chapterTitleCss })
    }

    const totalChapters = arg.packVolumes.reduce((sum, volume) => sum + volume.chapters.length, 0)
    let current = 0

    for (const volume of arg.packVolumes) {
      await this.waitIfPaused()
      progress?.({
        current,
        total: totalChapters,
        status: "downloading",
        currentVolume: volume.volumeName,
      })
      const volumeNav = new NavPoint(volume.volumeName)
      for (const chapter of volume.chapters) {
        await this.waitIfPaused()
        current += 1
        progress?.({
          current,
          total: totalChapters,
          status: "downloading",
          currentChapter: chapter.chapterName,
          currentVolume: volume.volumeName,
        })
        const doc = await this.resolveChapter(chapter, packer, arg.addChapterTitle)
        this.addTitle(doc, chapter.chapterName)
        let html = this.closeTag(doc)
        html = this.appendXmlDeclare(html)
        const name = `chapter${String(this.chapterSequence.next).padStart(6, "0")}.xhtml`
        packer.addChapter({
          addNavPoint: false,
          name: `OEBPS/${name}`,
          title: chapter.chapterName,
          chapterContent: html,
        })
        const chapterNav = new NavPoint(chapter.chapterName, { src: name })
        volumeNav.addChild(chapterNav)
        if (!volumeNav.src) {
          volumeNav.src = name
        }
      }
      packer.addNavPoint(volumeNav)
    }

    progress?.({ current: totalChapters, total: totalChapters, status: "packing" })
    const blob = await packer.pack()
    progress?.({ current: totalChapters, total: totalChapters, status: "completed" })
    return {
      fileName: `${this.sanitizeFileName(this.novel.title)}.epub`,
      blob,
    }
  }

  private async resolveChapter(
    chapter: Chapter,
    packer: EpubPacker,
    addChapterTitle: boolean,
    detector?: LightNovelCoverDetector,
  ): Promise<Document> {
    const doc = await this.source.getNovelChapter(chapter)
    await this.resolveImages(doc, packer, detector)
    if (addChapterTitle) {
      if (!doc.head) {
        const head = doc.createElement("head")
        doc.documentElement.insertBefore(head, doc.body ?? null)
      }
      const link = doc.createElement("link")
      link.setAttribute("rel", "stylesheet")
      link.setAttribute("type", "text/css")
      link.setAttribute("href", "styles/style.css")
      doc.head?.append(link)
      const chapterTitle = doc.createElement("div")
      chapterTitle.className = "chapter-title"
      chapterTitle.textContent = chapter.chapterName
      doc.body?.insertBefore(chapterTitle, doc.body.firstChild)
    }
    return doc
  }

  private async resolveImages(doc: Document, packer: EpubPacker, detector?: LightNovelCoverDetector) {
    const images = Array.from(doc.querySelectorAll("img"))
    for (const img of images) {
      await this.waitIfPaused()
      const src = img.getAttribute("src")
      if (!src)
        continue
      const imageData = await this.getSingleImage(src)
      if (imageData.length === 0) {
        continue
      }
      let info: ReturnType<typeof getImageInfo> | null = null
      try {
        info = getImageInfo(imageData)
      }
      catch {
        info = null
      }
      const name = `${String(this.imageSequence.next).padStart(6, "0")}.jpg`
      const relativeSrc = `images/${name}`
      packer.addImage({
        name: `OEBPS/${relativeSrc}`,
        data: imageData,
        mediaType: info?.mimeType ?? jpeg,
      })
      img.setAttribute("src", relativeSrc)
      try {
        detector?.add(`OEBPS/${relativeSrc}`, imageData)
      }
      catch (error) {
        if (!(error instanceof UnsupportedImageError)) {
          throw error
        }
      }
    }
    if (doc.body) {
      wrapDuoKanImage(doc.body)
    }
  }

  private async resolveCover(volume: Volume, packer: EpubPacker, detector: LightNovelCoverDetector) {
    if (volume.cover) {
      await this.waitIfPaused()
      const coverData = await this.getSingleImage(volume.cover)
      if (coverData.length === 0) {
        throw new Error(`下载封面失败 ${volume.cover}`)
      }
      let info: ReturnType<typeof getImageInfo> | null = null
      try {
        info = getImageInfo(coverData)
      }
      catch {
        info = null
      }
      const coverName = `images/${String(this.imageSequence.next).padStart(6, "0")}.jpg`
      packer.addImage({
        name: `OEBPS/${coverName}`,
        data: coverData,
        mediaType: info?.mimeType ?? jpeg,
      })
      packer.cover = { href: coverName, mediaType: info?.mimeType ?? jpeg }
      return
    }
    const detected = detector.detectCover()
    if (detected) {
      packer.cover = { href: detected.replace(/^OEBPS\//, ""), mediaType: jpeg }
    }
  }

  private async getSingleImage(src: string): Promise<Uint8Array> {
    await this.waitIfPaused()
    try {
      return await this.source.getImage(src)
    }
    catch {
      return new Uint8Array(0)
    }
  }

  private buildDocTitle(volume: Volume) {
    let title = `${volume.catalog.novel.title} ${volume.volumeName}`.trim()
    if (volume.volumeName.startsWith(volume.catalog.novel.title)) {
      title = volume.volumeName
    }
    return title
  }

  private getEpubFileName(volume: Volume) {
    const title = this.sanitizeFileName(volume.catalog.novel.title)
    const volumeName = this.sanitizeFileName(volume.volumeName)
    if (!volumeName) {
      return `${title}.epub`
    }
    if (volumeName.startsWith(title)) {
      return `${volumeName}.epub`
    }
    return `${title} ${volumeName}.epub`
  }

  private sanitizeFileName(name: string) {
    const keywords = [":", "*", "?", "\"", "\\", "/", "<", ">", "|", "\u0000", "　"]
    let safe = name
    keywords.forEach((keyword) => {
      safe = safe.replaceAll(keyword, " ")
    })
    if (safe.startsWith(".")) {
      safe = safe.slice(1)
    }
    if (safe.endsWith(".")) {
      safe = safe.slice(0, -1)
    }
    safe = safe.replace(/\s+/g, " ").trim()
    return safe
  }

  private addTitle(document: Document, title: string) {
    if (!document.head) {
      const head = document.createElement("head")
      document.documentElement.insertBefore(head, document.body ?? null)
    }
    const element = document.createElement("title")
    element.textContent = title
    document.head?.append(element)
  }

  private closeTag(document: Document) {
    let html = document.documentElement.outerHTML
    const regExp = /(<(?:img|link).*?)>/gi
    html = html.replace(regExp, (match, group1) => {
      if (match.endsWith("/>")) {
        return match
      }
      return `${group1}/>`
    })
    return html
  }

  private appendXmlDeclare(html: string) {
    const xmlDeclare = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
  "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
`
    return xmlDeclare + html
  }

  private async waitIfPaused() {
    while (this.paused && !this.stopped) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    if (this.stopped) {
      throw new Error("下载已停止")
    }
  }
}
