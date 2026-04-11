export class Novel {
  url?: string
  id = ""
  title = ""
  alias?: string
  author = ""
  status = ""
  coverUrl?: string
  tags?: string[]
  publisher?: string
  description?: string
  catalogUrl?: string

  toString() {
    let displayTitle = this.title
    if (this.alias && this.alias.trim()) {
      displayTitle += `(${this.alias})`
    }
    const lines = [
      displayTitle,
      `作者: ${this.author}`,
      `状态: ${this.status}`,
    ]
    if (this.tags && this.tags.length > 0) {
      lines.push(`标签: ${this.tags.join(", ")}`)
    }
    if (this.description) {
      lines.push(this.description)
    }
    return lines.join("\n")
  }
}

export class Catalog {
  novel: Novel
  volumes: Volume[] = []

  constructor(novel: Novel) {
    this.novel = novel
  }
}

export class Volume {
  volumeName: string
  catalog: Catalog
  chapters: Chapter[] = []
  cover?: string

  constructor(volumeName: string, catalog: Catalog) {
    this.volumeName = volumeName
    this.catalog = catalog
  }

  toString() {
    if (!this.volumeName) {
      return this.catalog.novel.title
    }
    return this.volumeName
  }
}

export class Chapter {
  chapterName: string
  chapterUrl?: string
  chapterContent?: string
  volume: Volume

  constructor(chapterName: string, chapterUrl: string | undefined, volume: Volume) {
    this.chapterName = chapterName
    this.chapterUrl = chapterUrl
    this.volume = volume
  }
}

export class PackArgument {
  addChapterTitle: boolean
  combineVolume: boolean
  packVolumes: Volume[]

  constructor({
    addChapterTitle,
    combineVolume = false,
    packVolumes,
  }: {
    addChapterTitle: boolean
    combineVolume?: boolean
    packVolumes: Volume[]
  }) {
    this.addChapterTitle = addChapterTitle
    this.combineVolume = combineVolume
    this.packVolumes = packVolumes
  }
}

export interface PackProgress {
  current: number
  total: number
  status: "preparing" | "downloading" | "packing" | "completed" | "error"
  currentChapter?: string
  currentVolume?: string
}

export interface PackResult {
  fileName: string
  blob: Blob
}
