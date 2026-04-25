import { Sequence } from "./sequence"

export class NavPoint {
  title: string
  src?: string
  children: NavPoint[]

  constructor(title: string, options: { src?: string, children?: NavPoint[] } = {}) {
    this.title = title
    this.src = options.src
    this.children = options.children ?? []
  }

  addChild(child: NavPoint) {
    this.children.push(child)
  }
}

export class EpubNavigator {
  docTitle = ""
  bookUuid = ""
  private navPoints: NavPoint[] = []

  addNavPoint(navPoint: NavPoint) {
    this.navPoints.push(navPoint)
  }

  build(): string {
    const seq = new Sequence()
    const navMap = this.navPoints.map(point => this.buildNavPoint(point, `navPoint-${seq.next}`)).join("")
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${this.bookUuid}" />
    <meta name="dtb:depth" content="1" />
    <meta name="dtb:totalPageCount" content="0" />
    <meta name="dtb:maxPageNumber" content="0" />
  </head>
  <docTitle><text>${this.docTitle}</text></docTitle>
  <navMap>
    ${navMap}
  </navMap>
</ncx>`
  }

  private buildNavPoint(navPoint: NavPoint, id: string): string {
    const childSeq = new Sequence()
    const children = navPoint.children.map(child => this.buildNavPoint(child, `${id}-${childSeq.next}`)).join("")
    const contentTag = navPoint.src ? `<content src="${navPoint.src}" />` : ""
    return `<navPoint id="${id}">
  <navLabel><text>${navPoint.title}</text></navLabel>
  ${contentTag}
  ${children}
</navPoint>`
  }
}
