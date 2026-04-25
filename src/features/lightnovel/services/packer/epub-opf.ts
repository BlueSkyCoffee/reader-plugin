import { css as cssMediaType, ncx as ncxMediaType } from "./epub-media-types"

export interface ManifestItem {
  id: string
  href: string
  mediaType: string
}

export class EpubOpf {
  docTitle = ""
  bookUuid = ""
  creator = ""
  source?: string
  publisher?: string
  subjects: string[] = []
  description?: string
  cover?: { href: string, mediaType: string }
  calibreSeries?: string
  calibreSeriesIndex?: number

  private manifestItems: ManifestItem[] = [
    { id: "ncx", href: "toc.ncx", mediaType: ncxMediaType },
  ]

  private spineRefs: string[] = []

  addImage(item: ManifestItem) {
    this.manifestItems.push(item)
  }

  addStylesheet(item: ManifestItem) {
    this.manifestItems.push({ ...item, mediaType: cssMediaType })
  }

  addChapter(item: ManifestItem) {
    this.manifestItems.push(item)
    this.spineRefs.push(item.id)
  }

  build(): string {
    const metaParts = [
      `<dc:identifier id="bookId">${this.bookUuid}</dc:identifier>`,
      `<dc:language>zh-CN</dc:language>`,
      `<dc:title>${this.docTitle}</dc:title>`,
      `<dc:creator>${this.creator}</dc:creator>`,
    ]
    if (this.source) {
      metaParts.push(`<dc:source>${this.source}</dc:source>`)
    }
    if (this.description) {
      metaParts.push(`<dc:description>${this.description}</dc:description>`)
    }
    if (this.publisher) {
      metaParts.push(`<dc:publisher>${this.publisher}</dc:publisher>`)
    }
    this.subjects.forEach(subject => metaParts.push(`<dc:subject>${subject}</dc:subject>`))
    metaParts.push(`<meta name="cover" content="cover-image" />`)
    if (this.calibreSeries) {
      metaParts.push(`<meta name="calibre:series" content="${this.calibreSeries}" />`)
    }
    if (this.calibreSeriesIndex !== undefined) {
      metaParts.push(`<meta name="calibre:series_index" content="${this.calibreSeriesIndex}" />`)
    }

    const manifestParts: string[] = []
    if (this.cover) {
      manifestParts.push(`<item id="cover-image" href="${this.cover.href}" media-type="${this.cover.mediaType}" />`)
    }
    this.manifestItems.forEach((item) => {
      if (this.cover && item.href === this.cover.href)
        return
      manifestParts.push(`<item id="${item.id}" href="${item.href}" media-type="${item.mediaType}" />`)
    })

    const spineParts = this.spineRefs.map(id => `<itemref idref="${id}" />`).join("")

    return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" xmlns:dc="http://purl.org/dc/elements/1.1/" unique-identifier="bookId" version="2.0">
  <metadata>
    ${metaParts.join("")}
  </metadata>
  <manifest>
    ${manifestParts.join("")}
  </manifest>
  <spine toc="ncx">
    ${spineParts}
  </spine>
</package>`
  }
}
