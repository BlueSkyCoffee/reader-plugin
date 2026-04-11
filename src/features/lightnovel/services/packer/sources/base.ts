import type { Catalog, Chapter, Novel } from "../types"

export const baseHtml = "<html xmlns='http://www.w3.org/1999/xhtml' lang='zh-CN'><body></body></html>"

export interface LightNovelSource {
  name: string
  sourceUrl: string
  supportUrl: (url: string) => boolean
  getNovel: (url: string) => Promise<Novel>
  getNovelCatalog: (novel: Novel) => Promise<Catalog>
  getNovelChapter: (chapter: Chapter) => Promise<Document>
  getImage: (src: string) => Promise<Uint8Array>
}
