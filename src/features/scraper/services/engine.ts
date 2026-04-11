import type { BookInfo, Chapter, ScraperRule, SearchResult } from "@/types/novel"
import { requestMessage } from "@/shared/infra/messaging"

type ContentType = "text" | "html" | "attr"

const NEXT_PAGE_TEXT_REGEX = /下一章|没有了|>>|书末页/
const NEXT_PAGE_URL_REGEX = /.*[-_]\d\.html/

export class ScraperEngine {
  private rule: ScraperRule

  constructor(rule: ScraperRule) {
    this.rule = rule
  }

  /**
   * 委托后台脚本发起跨域网络请求
   */
  async fetchHtml(
    url: string,
    method: "get" | "post" = "get",
    data?: BodyInit | null,
    options?: {
      baseUri?: string
      headers?: Record<string, string>
      cookies?: string
    },
  ): Promise<string> {
    const baseUri = options?.baseUri || this.rule.url
    const absoluteUrl = new URL(url, baseUri).href

    const headers: Record<string, string> = {
      Referer: baseUri,
      Origin: new URL(baseUri).origin,
      ...(options?.headers || {}),
    }

    if (options?.cookies && !Object.keys(headers).some(key => key.toLowerCase() === "cookie")) {
      headers.Cookie = options.cookies
    }

    try {
      const responseHtml = await requestMessage("fetchHtml", {
        url: absoluteUrl,
        method,
        data,
        headers,
      })
      return responseHtml
    }
    catch (error) {
      console.error(`[ScraperEngine] Fetch error for ${absoluteUrl}:`, error)
      throw error
    }
  }

  /**
   * 核心 DOM 解析器，支持 CSS 选择器、XPath 和动态提取函数
   */
  parseContent(
    html: string | HTMLElement | Document | Element,
    query: string,
    type: ContentType = "text",
    attrName?: string,
    baseUri?: string,
  ): string {
    if (!query)
      return ""

    const [selector, jsCode] = query.split("@js:")
    let result = ""

    const root = typeof html === "string"
      ? new DOMParser().parseFromString(html, "text/html")
      : (html as Document | Element)

    const selectorTrim = selector.trim()
    let effectiveType = type
    let effectiveAttr = attrName

    if (effectiveType === "text" && selectorTrim.startsWith("meta[")) {
      effectiveType = "attr"
      effectiveAttr = "content"
    }

    const elements = this.selectAll(root, selectorTrim)
    const element = elements[0]

    if (element) {
      if (effectiveType === "text") {
        result = element.textContent?.trim() || ""
      }
      else if (effectiveType === "html") {
        result = element.innerHTML?.trim() || ""
      }
      else if (effectiveType === "attr" && effectiveAttr) {
        const attrValue = element.getAttribute(effectiveAttr) || ""
        result = this.resolveAttr(attrValue, effectiveAttr, baseUri)
      }
    }
    else if (!selectorTrim && jsCode) {
      result = typeof html === "string" ? html : (root as Element).innerHTML || ""
    }

    if (jsCode && result !== undefined) {
      result = this.runRuleJs(jsCode, result)
    }

    return result
  }

  private selectAll(root: Document | Element, query: string): Element[] {
    if (!query)
      return []

    if (query.startsWith("/") || query.startsWith("//") || query.startsWith("(/")) {
      try {
        const doc = root.nodeType === Node.DOCUMENT_NODE
          ? (root as Document)
          : (root as Element).ownerDocument || document
        const snapshot = doc.evaluate(
          query,
          root,
          null,
          XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
          null,
        )

        const nodes: Element[] = []
        for (let i = 0; i < snapshot.snapshotLength; i += 1) {
          const node = snapshot.snapshotItem(i)
          if (node && node.nodeType === Node.ELEMENT_NODE) {
            nodes.push(node as Element)
          }
        }
        return nodes
      }
      catch (error) {
        console.warn("XPath parse error:", query, error)
        return []
      }
    }

    try {
      return Array.from(root.querySelectorAll(query))
    }
    catch (error) {
      console.warn("CSS selector parse error:", query, error)
      return []
    }
  }

  private resolveAttr(value: string, attrName: string, baseUri?: string) {
    if (!value)
      return ""

    if (attrName === "href" || attrName === "src") {
      return this.resolveUrl(value, baseUri)
    }

    return value
  }

  private resolveUrl(value: string, baseUri?: string) {
    if (!value)
      return ""

    try {
      return new URL(value, baseUri || this.rule.url).href
    }
    catch {
      return value
    }
  }

  private runRuleJs(jsCode: string, input: string) {
    try {
      // eslint-disable-next-line no-new-func
      const fn = new Function(
        "r",
        `var result = r; ${jsCode}; return typeof r !== 'undefined' ? r : result;`,
      )
      return fn(input)
    }
    catch (error) {
      console.error("Custom rule JS error:", jsCode, error)
      return input
    }
  }

  /**
   * 按照书源配置中的搜索规则检索站点
   */
  async search(keyword: string): Promise<SearchResult[]> {
    const searchRule = this.rule.search
    if (!searchRule || searchRule.disabled || this.rule.disabled)
      return []

    const searchUrl = this.buildSearchUrl(keyword)
    const body = searchRule.method === "post"
      ? this.buildFormData(searchRule.data, keyword)
      : undefined

    let html = ""
    try {
      html = await this.fetchHtml(searchUrl, searchRule.method, body, {
        baseUri: searchRule.baseUri || this.rule.url,
        headers: searchRule.headers,
        cookies: searchRule.cookies,
      })
    }
    catch (error) {
      console.error(`[ScraperEngine] Network error during search:`, error)
      return []
    }

    if (!html)
      return []

    if (searchRule.responseType === "quanben5") {
      html = this.parseQuanben5Response(html)
    }

    const doc = new DOMParser().parseFromString(html, "text/html")
    const results = this.parseSearchResults(doc, searchUrl)

    if (!searchRule.pagination || !searchRule.nextPage)
      return results

    const paginationUrls = this.collectPaginationUrls(doc, searchRule.nextPage, searchRule.baseUri)
    if (paginationUrls.length === 0)
      return results

    const extraResults = await Promise.all(
      paginationUrls.map(async (url) => {
        try {
          const pageHtml = await this.fetchHtml(url, "get", undefined, {
            baseUri: searchRule.baseUri || this.rule.url,
            headers: searchRule.headers,
            cookies: searchRule.cookies,
          })
          const pageDoc = new DOMParser().parseFromString(pageHtml, "text/html")
          return this.parseSearchResults(pageDoc, url)
        }
        catch (error) {
          console.warn(`[ScraperEngine] Pagination search failed: ${url}`, error)
          return []
        }
      }),
    )

    return [...results, ...extraResults.flat()]
  }

  private parseSearchResults(doc: Document, pageUrl: string): SearchResult[] {
    const searchRule = this.rule.search
    if (!searchRule)
      return []

    const items = this.selectAll(doc, searchRule.result)
    const results: SearchResult[] = []

    if (items.length === 0) {
      const bookName = this.parseContent(doc, this.rule.book.bookName, "text", undefined, this.rule.book.baseUri)
      if (bookName) {
        results.push({
          sourceId: this.rule.id,
          bookName: bookName.trim(),
          url: pageUrl,
          author: this.parseContent(doc, this.rule.book.author, "text", undefined, this.rule.book.baseUri) || "未知",
          latestChapter: this.rule.book.latestChapter
            ? this.parseContent(doc, this.rule.book.latestChapter, "text", undefined, this.rule.book.baseUri)
            : undefined,
          lastUpdateTime: this.rule.book.lastUpdateTime
            ? this.parseContent(doc, this.rule.book.lastUpdateTime, "text", undefined, this.rule.book.baseUri)
            : undefined,
        })
      }
      return results
    }

    for (const item of items) {
      try {
        const bookName = this.parseContent(item, searchRule.bookName, "text", undefined, searchRule.baseUri)
        const bookUrlAttribute = this.parseContent(item, searchRule.bookName, "attr", "href", searchRule.baseUri)
        const author = searchRule.author
          ? this.parseContent(item, searchRule.author, "text", undefined, searchRule.baseUri)
          : ""

        if (!bookName || !bookName.trim() || !bookUrlAttribute)
          continue

        results.push({
          sourceId: this.rule.id,
          bookName: bookName.trim(),
          url: bookUrlAttribute,
          author: author?.trim() || "未知",
          latestChapter: searchRule.latestChapter ? this.parseContent(item, searchRule.latestChapter, "text", undefined, searchRule.baseUri) : undefined,
          lastUpdateTime: searchRule.lastUpdateTime ? this.parseContent(item, searchRule.lastUpdateTime, "text", undefined, searchRule.baseUri) : undefined,
          category: searchRule.category ? this.parseContent(item, searchRule.category, "text", undefined, searchRule.baseUri) : undefined,
          status: searchRule.status ? this.parseContent(item, searchRule.status, "text", undefined, searchRule.baseUri) : undefined,
          wordCount: searchRule.wordCount ? this.parseContent(item, searchRule.wordCount, "text", undefined, searchRule.baseUri) : undefined,
        })
      }
      catch (error) {
        console.error(`[ScraperEngine] Parse item error`, error)
      }
    }

    return results
  }

  /**
   * 获取书籍详情及章节目录
   */
  async getBookInfo(bookUrl: string): Promise<{ info: BookInfo, toc: Chapter[] }> {
    const html = await this.fetchHtml(bookUrl, "get", undefined, { baseUri: this.rule.book.baseUri || this.rule.url })
    const doc = new DOMParser().parseFromString(html, "text/html")

    const bookRule = this.rule.book
    const info: BookInfo = {
      url: bookUrl,
      bookName: this.parseContent(doc, bookRule.bookName, "text", undefined, bookRule.baseUri),
      author: this.parseContent(doc, bookRule.author, "text", undefined, bookRule.baseUri),
      intro: this.parseContent(doc, bookRule.intro, "text", undefined, bookRule.baseUri),
      coverUrl: bookRule.coverUrl
        ? this.parseContent(doc, bookRule.coverUrl, "attr", "src", bookRule.baseUri)
        || this.parseContent(doc, bookRule.coverUrl, "attr", "content", bookRule.baseUri)
        : undefined,
      category: bookRule.category ? this.parseContent(doc, bookRule.category, "text", undefined, bookRule.baseUri) : undefined,
      latestChapter: bookRule.latestChapter ? this.parseContent(doc, bookRule.latestChapter, "text", undefined, bookRule.baseUri) : undefined,
      lastUpdateTime: bookRule.lastUpdateTime ? this.parseContent(doc, bookRule.lastUpdateTime, "text", undefined, bookRule.baseUri) : undefined,
      status: bookRule.status ? this.parseContent(doc, bookRule.status, "text", undefined, bookRule.baseUri) : undefined,
      wordCount: bookRule.wordCount ? this.parseContent(doc, bookRule.wordCount, "text", undefined, bookRule.baseUri) : undefined,
    }

    if (info.coverUrl) {
      info.coverUrl = this.resolveUrl(info.coverUrl, bookUrl)
    }

    const tocPages = await this.fetchTocPages(bookUrl, doc)
    const toc = this.extractToc(tocPages, bookUrl)

    return { info, toc }
  }

  private async fetchTocPages(bookUrl: string, doc: Document) {
    const tocRule = this.rule.toc
    const pages: Array<{ url: string, doc: Document }> = []

    if (!tocRule.url) {
      pages.push({ url: bookUrl, doc })
      return pages
    }

    const bookId = this.extractBookId(bookUrl)
    const tocUrl = this.formatTemplate(tocRule.url, [bookId])
    const tocBase = tocRule.baseUri || this.rule.url
    const absoluteTocUrl = this.resolveUrl(tocUrl, tocBase || bookUrl)
    const tocHtml = await this.fetchHtml(absoluteTocUrl, "get", undefined, { baseUri: tocBase })
    const tocDoc = new DOMParser().parseFromString(tocHtml, "text/html")

    pages.push({ url: absoluteTocUrl, doc: tocDoc })

    if (!tocRule.pagination || !tocRule.nextPage) {
      return pages
    }

    const paginationUrls = this.collectPaginationUrls(tocDoc, tocRule.nextPage, tocRule.baseUri)
    for (const url of paginationUrls) {
      try {
        const pageHtml = await this.fetchHtml(url, "get", undefined, { baseUri: tocBase })
        const pageDoc = new DOMParser().parseFromString(pageHtml, "text/html")
        pages.push({ url, doc: pageDoc })
      }
      catch (error) {
        console.warn(`[ScraperEngine] Toc pagination failed: ${url}`, error)
      }
    }

    return pages
  }

  private extractToc(pages: Array<{ url: string, doc: Document }>, bookUrl: string): Chapter[] {
    const tocRule = this.rule.toc
    const toc: Chapter[] = []
    const seen = new Set<string>()

    pages.forEach((page, pageIndex) => {
      const container = this.buildTocContainer(page.doc)
      const items = this.selectAll(container, tocRule.item)

      items.forEach((item) => {
        const title = item.textContent?.trim() || ""
        const rawUrl = item.getAttribute("href") || item.getAttribute("value") || ""
        const resolvedUrl = this.resolveUrl(rawUrl, tocRule.baseUri || page.url || bookUrl)

        if (!title || !resolvedUrl || seen.has(resolvedUrl))
          return

        seen.add(resolvedUrl)
        toc.push({
          bookId: this.rule.name,
          title,
          url: resolvedUrl,
          order: toc.length + 1,
        })
      })

      if (items.length === 0 && pageIndex === 0) {
        console.warn(`[ScraperEngine] Toc items empty for ${page.url}`)
      }
    })

    if (tocRule.isDesc) {
      toc.reverse()
    }

    return toc
  }

  private buildTocContainer(doc: Document): Document | Element {
    const tocRule = this.rule.toc
    if (!tocRule.list) {
      return doc
    }

    const listHtml = this.parseContent(doc, tocRule.list, "html", undefined, tocRule.baseUri)
    if (!listHtml)
      return doc

    const temp = document.createElement("div")
    temp.innerHTML = listHtml
    return temp
  }

  private collectPaginationUrls(doc: Document, selector: string, baseUri?: string): string[] {
    const elements = this.selectAll(doc, selector)
    if (elements.length === 0)
      return []

    const urls: string[] = []
    const seen = new Set<string>()

    elements.forEach((el) => {
      const rawUrl = el.getAttribute("href")
        || el.getAttribute("value")
        || el.getAttribute("data-href")
        || ""
      const absoluteUrl = this.resolveUrl(rawUrl, baseUri)
      if (!absoluteUrl || seen.has(absoluteUrl))
        return

      seen.add(absoluteUrl)
      urls.push(absoluteUrl)
    })

    return urls
  }

  /**
   * 获取并过滤章节正文内容
   */
  async getChapterContent(chapterUrl: string): Promise<string> {
    const chapterRule = this.rule.chapter
    const baseUri = chapterRule.baseUri || this.rule.url

    if (chapterRule.pagination) {
      return this.fetchPaginatedChapterContent(chapterUrl, baseUri)
    }

    const html = await this.fetchHtml(chapterUrl, "get", undefined, { baseUri })
    const doc = new DOMParser().parseFromString(html, "text/html")

    let content = this.parseContent(doc, chapterRule.content, "html", undefined, baseUri)
    if (!content) {
      throw new Error("正文内容为空")
    }

    content = this.applyChapterFilters(content)
    return this.formatChapterContent(content)
  }

  private async fetchPaginatedChapterContent(startUrl: string, baseUri: string): Promise<string> {
    const chapterRule = this.rule.chapter
    let nextUrl: string | null = startUrl
    const contentParts: string[] = []
    const visited = new Set<string>()

    while (nextUrl) {
      if (visited.has(nextUrl))
        break

      visited.add(nextUrl)
      const html = await this.fetchHtml(nextUrl, "get", undefined, { baseUri })
      const doc = new DOMParser().parseFromString(html, "text/html")
      const pageContent = this.parseContent(doc, chapterRule.content, "html", undefined, baseUri)

      if (pageContent) {
        contentParts.push(pageContent)
      }

      const nextCandidate = this.resolveNextPageUrl(doc, baseUri)
      if (this.isLastPage(nextCandidate, doc)) {
        break
      }

      nextUrl = nextCandidate
    }

    const merged = contentParts.join("")
    if (!merged) {
      throw new Error("正文内容为空")
    }

    const filtered = this.applyChapterFilters(merged)
    return this.formatChapterContent(filtered)
  }

  private resolveNextPageUrl(doc: Document, baseUri: string): string | null {
    const chapterRule = this.rule.chapter

    if (chapterRule.nextPageInJs) {
      const jsValue = this.parseContent(doc, chapterRule.nextPageInJs, "html", undefined, baseUri)
      const resolved = this.resolveUrl(jsValue, baseUri)
      return resolved || null
    }

    if (!chapterRule.nextPage) {
      return null
    }

    const nextEls = this.selectAll(doc, chapterRule.nextPage)
    if (nextEls.length === 0) {
      return null
    }

    const rawUrl = nextEls[0].getAttribute("href") || nextEls[0].getAttribute("value") || ""
    return this.resolveUrl(rawUrl, baseUri) || null
  }

  private isLastPage(nextUrl: string | null, doc: Document): boolean {
    if (!nextUrl)
      return true

    const chapterRule = this.rule.chapter
    if (chapterRule.nextChapterLink) {
      try {
        const regex = new RegExp(chapterRule.nextChapterLink)
        if (regex.test(nextUrl)) {
          return true
        }
      }
      catch {
        // ignore invalid regex
      }
    }

    const nextEls = chapterRule.nextPage ? this.selectAll(doc, chapterRule.nextPage) : []
    const nextText = nextEls.map(el => el.textContent || "").join(" ")

    if (!NEXT_PAGE_URL_REGEX.test(nextUrl) && NEXT_PAGE_TEXT_REGEX.test(nextText)) {
      return true
    }

    return false
  }

  private applyChapterFilters(content: string) {
    let filtered = content

    filtered = filtered.replace(/&[^;]+;/g, "")

    if (this.rule.chapter.filterTag) {
      const tags = this.rule.chapter.filterTag.split(/\s+/)
      const temp = document.createElement("div")
      temp.innerHTML = filtered

      tags.forEach((tag) => {
        if (!tag.trim())
          return
        try {
          temp.querySelectorAll(tag.trim()).forEach(el => el.remove())
        }
        catch {
          // ignore invalid selectors
        }
      })

      filtered = temp.innerHTML
    }

    if (this.rule.chapter.filterTxt) {
      const filters = this.rule.chapter.filterTxt.split("|")
      filters.forEach((f) => {
        if (!f.trim())
          return
        try {
          const regex = new RegExp(f, "g")
          filtered = filtered.replace(regex, "")
        }
        catch {
          filtered = filtered.split(f).join("")
        }
      })
    }

    return filtered
  }

  private formatChapterContent(content: string) {
    const cleaned = this.clearAllAttributes(content)
    const chapterRule = this.rule.chapter

    if (chapterRule.paragraphTagClosed) {
      return cleaned.replace(/<(?!p\b)([^>]+)>([\s\S]*?)<\/\1>/g, "<p>$2</p>")
    }

    const splitter = new RegExp(chapterRule.paragraphTag || "<br>+", "g")
    const parts = cleaned.split(splitter)
    return parts
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => `<p>${part}</p>`)
      .join("")
  }

  private clearAllAttributes(html: string) {
    const temp = document.createElement("div")
    temp.innerHTML = html

    temp.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        el.removeAttribute(attr.name)
      }
    })

    return temp.innerHTML.replace(/\n/g, "").trim()
  }

  private buildFormData(template: string | undefined, keyword: string) {
    if (!template)
      return undefined

    const payload = template.trim().replace(/^\{|\}$/g, "")
    if (!payload)
      return undefined

    const params = new URLSearchParams()
    payload.split(",").forEach((segment) => {
      const [rawKey, ...rest] = segment.split(":")
      const key = rawKey?.trim()
      if (!key)
        return

      const rawValue = rest.join(":").trim()
      if (!rawValue)
        return

      const value = this.stripQuotes(rawValue).replaceAll("%s", keyword)
      params.set(key, value)
    })

    return params.toString()
  }

  private stripQuotes(value: string) {
    return value.replace(/^['"]|['"]$/g, "")
  }

  private buildSearchUrl(keyword: string) {
    const searchRule = this.rule.search
    if (!searchRule)
      return ""

    if (searchRule.urlBuilder === "quanben5") {
      const paramB = this.buildQuanben5Param(keyword)
      return this.formatTemplate(searchRule.url, [encodeURIComponent(keyword), paramB])
    }

    return this.formatTemplate(searchRule.url, [encodeURIComponent(keyword)])
  }

  private formatTemplate(template: string, args: string[]) {
    let result = template
    args.forEach((arg) => {
      result = result.replace("%s", arg)
    })
    return result
  }

  private buildQuanben5Param(keyword: string) {
    const staticchars = "PXhw7UT1B0a9kQDKZsjIASmOezxYG4CHo5Jyfg2b8FLpEvRr3WtVnlqMidu6cN"
    let encoded = ""
    const encodedKeyword = encodeURI(keyword)

    for (let i = 0; i < encodedKeyword.length; i += 1) {
      const char = encodedKeyword[i]
      const index = staticchars.indexOf(char)
      const code = index === -1 ? char : staticchars[(index + 3) % 62]
      const num1 = Math.floor(Math.random() * 62)
      const num2 = Math.floor(Math.random() * 62)
      encoded += staticchars[num1] + code + staticchars[num2]
    }

    return encodeURI(encoded)
  }

  private parseQuanben5Response(raw: string) {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch)
      return raw

    try {
      const parsed = JSON.parse(jsonMatch[0]) as { content?: string }
      return parsed.content || raw
    }
    catch {
      const contentMatch = raw.match(/"content"\s*:\s*"([\s\S]*?)"\s*[},]/)
      if (!contentMatch)
        return raw

      try {
        return JSON.parse(`"${contentMatch[1].replace(/"/g, "\\\"")}"`)
      }
      catch {
        return contentMatch[1]
      }
    }
  }

  private extractBookId(bookUrl: string): string {
    const bookRuleUrl = this.rule.book.url
    if (bookRuleUrl) {
      try {
        const regex = new RegExp(bookRuleUrl)
        const match = bookUrl.match(regex)
        if (match?.[1])
          return match[1]
        if (match?.[0])
          return match[0]
      }
      catch {
        // ignore invalid regex
      }
    }

    const fallbackMatch = bookUrl.match(/(\d+)/)
    return fallbackMatch ? fallbackMatch[1] : bookUrl
  }
}
