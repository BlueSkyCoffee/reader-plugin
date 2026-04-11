import JSZip from "jszip"
import { containerXml, mimeType } from "./constants"
import { css as cssMediaType, xhtml as xhtmlMediaType } from "./media-types"
import { EpubNavigator, NavPoint } from "./navigator"
import { EpubOpf } from "./opf"

export class EpubPacker {
  private zip = new JSZip()
  private navigator = new EpubNavigator()
  private opf = new EpubOpf()
  private archiveFiles = new Set<string>()

  docTitle = ""
  creator = ""
  source?: string
  publisher?: string
  subjects: string[] = []
  description?: string
  cover?: { href: string, mediaType: string }
  calibreSeries?: string
  calibreSeriesIndex?: number

  addChapter(params: {
    id?: string
    mediaType?: string
    addNavPoint?: boolean
    name: string
    title: string
    chapterContent: string
  }) {
    const {
      id,
      mediaType = xhtmlMediaType,
      addNavPoint = true,
      name,
      title,
      chapterContent,
    } = params
    const href = this.relativeToOebps(name)
    const itemId = this.normalizeId(id ?? href)
    this.addArchiveFile(name, chapterContent)
    this.opf.addChapter({ id: itemId, href, mediaType })
    if (addNavPoint) {
      this.navigator.addNavPoint(new NavPoint(title, { src: href }))
    }
  }

  addImage(params: { id?: string, mediaType: string, name: string, data: Uint8Array }) {
    const { id, mediaType, name, data } = params
    const href = this.relativeToOebps(name)
    const itemId = this.normalizeId(id ?? href)
    this.addArchiveFile(name, data)
    this.opf.addImage({ id: itemId, href, mediaType })
  }

  addStylesheet(params: { name: string, content: string }) {
    const { name, content } = params
    const href = this.relativeToOebps(name)
    const id = this.normalizeId(this.fileName(name))
    this.addArchiveFile(name, content)
    this.opf.addStylesheet({ id, href, mediaType: cssMediaType })
  }

  addNavPoint(navPoint: NavPoint) {
    this.navigator.addNavPoint(navPoint)
  }

  async pack(): Promise<Blob> {
    this.navigator.docTitle = this.docTitle
    this.opf.docTitle = this.docTitle
    this.opf.creator = this.creator
    this.opf.source = this.source
    this.opf.publisher = this.publisher
    this.opf.subjects = this.subjects
    this.opf.description = this.description
    this.opf.cover = this.cover
    this.opf.calibreSeries = this.calibreSeries
    this.opf.calibreSeriesIndex = this.calibreSeriesIndex
    const uuid = crypto.randomUUID()
    this.navigator.bookUuid = uuid
    this.opf.bookUuid = uuid

    this.zip.file("mimetype", mimeType, { compression: "STORE" })
    this.zip.file("META-INF/container.xml", containerXml)

    const toc = this.navigator.build()
    this.zip.file("OEBPS/toc.ncx", toc)
    const opf = this.opf.build()
    this.zip.file("OEBPS/content.opf", opf)

    return this.zip.generateAsync({ type: "blob" })
  }

  private addArchiveFile(name: string, content: string | Uint8Array) {
    if (this.archiveFiles.has(name)) {
      return
    }
    this.archiveFiles.add(name)
    this.zip.file(name, content)
  }

  private normalizeId(id: string) {
    return id.replace(/[\\/.]/g, "_")
  }

  private relativeToOebps(name: string) {
    return name.replace(/^OEBPS[\\/]/, "").replace(/\\/g, "/")
  }

  private fileName(name: string) {
    const segments = name.split("/")
    return segments[segments.length - 1]
  }
}
