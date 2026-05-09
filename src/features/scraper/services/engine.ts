import type { BookInfo, Chapter, ScraperRule, SearchResult } from "@/types/novel"
import type { ChineseLocale } from "@/utils/chinese-converter"
import { requestMessage } from "@/lib/messaging"
import { convertChinese } from "@/utils/chinese-converter"
import { fetchCoverAsDataUrl } from "@/utils/cover-proxy"
import { log } from "@/utils/logger"

type ContentType = "text" | "html" | "attr"

const NEXT_PAGE_TEXT_REGEX = /下一章|没有了|>>|书末页/
const NEXT_PAGE_URL_REGEX = /.*[-_]\d\.html/
const RULE_JS_SEPARATOR = "@js:"
const RULE_ATTR_SUFFIX_REGEX = /@([a-z][\w:-]*)$/i
const COVER_ATTR_CANDIDATES = [
  "src",
  "data-src",
  "data-original",
  "data-lazy-src",
  "data-echo",
  "content",
  "href",
  "value",
] as const
const COVER_FALLBACK_SELECTORS = [
  "meta[property=\"og:image\"]",
  "meta[name=\"og:image\"]",
  "meta[property=\"og:image:url\"]",
  "meta[name=\"twitter:image\"]",
  "meta[property=\"twitter:image\"]",
  "meta[itemprop=\"image\"]",
  "link[rel=\"image_src\"]",
  "img[itemprop=\"image\"]",
  ".book-cover img",
  ".bookimg img",
  ".book-img img",
  ".bookimage img",
  ".cover img",
  ".coverecom img",
  ".imgbox img",
  "#bookimg img",
  "#fmimg img",
] as const

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
      log.scraper.error(`Fetch failed: ${absoluteUrl}`, error)
      throw error
    }
  }

  /**
   * 核心 DOM 解析器，支持 CSS 选择器、XPath 和动态提取函数
   * 多元素匹配时拼接所有元素的文本/HTML
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

    const { selector, jsCode, attrSuffix } = this.parseRuleQuery(query)
    let result = ""

    const root = typeof html === "string"
      ? new DOMParser().parseFromString(html, "text/html")
      : (html as Document | Element)

    const selectorTrim = selector.trim()
    let effectiveType = type
    let effectiveAttr = attrSuffix || attrName

    if (effectiveType === "text" && selectorTrim.startsWith("meta[")) {
      effectiveType = "attr"
      effectiveAttr = "content"
    }
    else if (attrSuffix) {
      effectiveType = "attr"
    }

    const elements = this.selectAll(root, selectorTrim)

    if (elements.length > 0) {
      if (effectiveType === "text") {
        // 拼接所有匹配元素的文本
        result = elements.map(el => el.textContent?.trim() || "").filter(Boolean).join("")
      }
      else if (effectiveType === "html") {
        // 拼接所有匹配元素的 HTML
        result = elements.map(el => el.innerHTML?.trim() || "").filter(Boolean).join("")
      }
      else if (effectiveType === "attr" && effectiveAttr) {
        // 属性取第一个元素即可
        const attrValue = elements[0].getAttribute(effectiveAttr) || ""
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

  private parseRuleQuery(query: string) {
    const jsIndex = query.indexOf(RULE_JS_SEPARATOR)
    const selectorPart = jsIndex >= 0 ? query.slice(0, jsIndex) : query
    const jsCode = jsIndex >= 0 ? query.slice(jsIndex + RULE_JS_SEPARATOR.length) : undefined
    const attrMatch = selectorPart.match(RULE_ATTR_SUFFIX_REGEX)

    if (!attrMatch) {
      return {
        selector: selectorPart,
        jsCode,
        attrSuffix: undefined,
      }
    }

    return {
      selector: selectorPart.slice(0, attrMatch.index),
      jsCode,
      attrSuffix: attrMatch[1],
    }
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
        log.scraper.warn(`XPath parse failed: ${query}`, error)
        return []
      }
    }

    try {
      return Array.from(root.querySelectorAll(query))
    }
    catch (error) {
      log.scraper.warn(`CSS selector parse failed: ${query}`, error)
      return []
    }
  }

  private resolveAttr(value: string, attrName: string, baseUri?: string) {
    if (!value)
      return ""

    if (this.isUrlAttribute(attrName)) {
      return this.resolveUrl(value, baseUri)
    }

    return value
  }

  private isUrlAttribute(attrName: string) {
    const lower = attrName.toLowerCase()
    return lower === "href"
      || lower === "src"
      || lower === "action"
      || lower === "poster"
      || lower === "data-src"
      || lower === "data-original"
      || lower === "data-lazy-src"
      || lower === "data-echo"
      || lower === "data-href"
      || lower === "data-url"
      || lower === "data-link"
      || lower.endsWith("src")
      || lower.endsWith("url")
      || lower.endsWith("href")
  }

  private resolveUrl(value: string, baseUri?: string) {
    if (!value)
      return ""

    const normalizedValue = this.normalizeUrlValue(value)

    try {
      return new URL(normalizedValue, baseUri || this.rule.url).href
    }
    catch {
      return normalizedValue
    }
  }

  private normalizeUrlValue(value: string) {
    return value
      .trim()
      .replace(/^url\((['"]?)(.*?)\1\)$/i, "$2")
      .replaceAll("&amp;", "&")
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
      log.scraper.error(`Custom rule JS failed: ${jsCode}`, error)
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
      log.scraper.error("Network error during search", error)
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
          log.scraper.warn(`Pagination search failed: ${url}`, error)
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
        log.scraper.error("Parse search item failed", error)
      }
    }

    return results
  }

  /**
   * 获取书籍详情及章节目录
   * @param bookUrl 书籍详情页 URL
   * @param targetLanguage 目标语言（可选），用于简繁转换
   */
  async getBookInfo(bookUrl: string, targetLanguage?: ChineseLocale): Promise<{ info: BookInfo, toc: Chapter[] }> {
    const html = await this.fetchHtml(bookUrl, "get", undefined, { baseUri: this.rule.book.baseUri || this.rule.url })
    const doc = new DOMParser().parseFromString(html, "text/html")

    const bookRule = this.rule.book
    const sourceLanguage = this.rule.language as ChineseLocale || "cn"

    const coverUrl = this.extractCoverUrl(doc, bookRule.coverUrl, bookUrl)

    // 通过后台脚本代理获取封面，绕过 CORS/防盗链
    const proxiedCover = coverUrl ? await fetchCoverAsDataUrl(coverUrl) : undefined

    const info: BookInfo = {
      url: bookUrl,
      bookName: this.parseContent(doc, bookRule.bookName, "text", undefined, bookRule.baseUri),
      author: this.parseContent(doc, bookRule.author, "text", undefined, bookRule.baseUri),
      intro: this.parseContent(doc, bookRule.intro, "text", undefined, bookRule.baseUri),
      coverUrl: proxiedCover || coverUrl,
      category: bookRule.category ? this.parseContent(doc, bookRule.category, "text", undefined, bookRule.baseUri) : undefined,
      latestChapter: bookRule.latestChapter ? this.parseContent(doc, bookRule.latestChapter, "text", undefined, bookRule.baseUri) : undefined,
      lastUpdateTime: bookRule.lastUpdateTime ? this.parseContent(doc, bookRule.lastUpdateTime, "text", undefined, bookRule.baseUri) : undefined,
      status: bookRule.status ? this.parseContent(doc, bookRule.status, "text", undefined, bookRule.baseUri) : undefined,
      wordCount: bookRule.wordCount ? this.parseContent(doc, bookRule.wordCount, "text", undefined, bookRule.baseUri) : undefined,
    }

    // 应用简繁转换
    if (targetLanguage && sourceLanguage !== targetLanguage) {
      info.bookName = convertChinese(info.bookName, sourceLanguage, targetLanguage)
      info.author = convertChinese(info.author, sourceLanguage, targetLanguage)
      info.intro = convertChinese(info.intro, sourceLanguage, targetLanguage)
      if (info.category) {
        info.category = convertChinese(info.category, sourceLanguage, targetLanguage)
      }
      if (info.latestChapter) {
        info.latestChapter = convertChinese(info.latestChapter, sourceLanguage, targetLanguage)
      }
    }

    const tocPages = await this.fetchTocPages(bookUrl, doc)
    const toc = this.extractToc(tocPages, bookUrl, sourceLanguage, targetLanguage)

    return { info, toc }
  }

  private extractCoverUrl(doc: Document, coverRule: string | undefined, bookUrl: string) {
    const baseUri = this.rule.book.baseUri || bookUrl

    if (coverRule) {
      const explicitCover = this.extractCoverFromSelector(doc, coverRule, baseUri)
      if (explicitCover) {
        return explicitCover
      }
    }

    for (const selector of COVER_FALLBACK_SELECTORS) {
      const cover = this.extractCoverFromSelector(doc, selector, baseUri)
      if (cover) {
        return cover
      }
    }

    return undefined
  }

  private extractCoverFromSelector(doc: Document, selector: string, baseUri: string) {
    const elements = this.selectAll(doc, selector.trim())
    if (elements.length === 0)
      return ""

    const el = elements[0]

    // meta 标签直接取 content 属性
    if (selector.trim().startsWith("meta[")) {
      const content = el.getAttribute("content") || ""
      return this.normalizeCoverUrl(content, baseUri)
    }

    // img/a 等元素：依次尝试多个属性，直接用 resolveUrl 解析
    for (const attr of COVER_ATTR_CANDIDATES) {
      const raw = el.getAttribute(attr)
      if (!raw)
        continue
      const normalized = this.normalizeCoverUrl(raw, baseUri)
      if (normalized)
        return normalized
    }

    // 兜底：text 内容（如 img alt 等场景几乎无用，但保留兼容性）
    const text = el.textContent?.trim() || ""
    return this.normalizeCoverUrl(text, baseUri)
  }

  private normalizeCoverUrl(value: string, baseUri: string) {
    if (!value) {
      return ""
    }

    const normalizedValue = this.normalizeUrlValue(value)
    if (!normalizedValue || normalizedValue === "#" || normalizedValue.startsWith("javascript:")) {
      return ""
    }

    // 绝对 URL、协议相对、根相对、点相对
    if (/^(?:https?:|data:image\/|blob:|\/\/|\/|\.{1,2}\/)/i.test(normalizedValue)) {
      return this.resolveUrl(normalizedValue, baseUri)
    }

    // 相对路径（如 images/cover.jpg）也尝试解析
    if (/^[a-z0-9]/i.test(normalizedValue) && !normalizedValue.includes(":")) {
      try {
        return new URL(normalizedValue, baseUri).href
      }
      catch {
        // 解析失败则忽略
      }
    }

    return ""
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
        log.scraper.warn(`TOC pagination failed: ${url}`, error)
      }
    }

    return pages
  }

  /**
   * 提取目录，URL + 标题双重去重
   */
  private extractToc(
    pages: Array<{ url: string, doc: Document }>,
    bookUrl: string,
    sourceLanguage?: ChineseLocale,
    targetLanguage?: ChineseLocale,
  ): Chapter[] {
    const tocRule = this.rule.toc
    const toc: Chapter[] = []
    const seenUrls = new Set<string>()
    const seenTitles = new Set<string>()

    pages.forEach((page, pageIndex) => {
      const container = this.buildTocContainer(page.doc)
      const items = this.selectAll(container, tocRule.item)

      items.forEach((item) => {
        let title = item.textContent?.trim() || ""
        const rawUrl = item.getAttribute("href") || item.getAttribute("value") || ""
        const resolvedUrl = this.resolveUrl(rawUrl, tocRule.baseUri || page.url || bookUrl)

        if (!title || !resolvedUrl)
          return

        // URL 去重
        if (seenUrls.has(resolvedUrl))
          return

        // 标题去重（同标题章节后者覆盖前者）
        if (seenTitles.has(title)) {
          // 找到同标题的旧章节并替换
          const existingIndex = toc.findIndex(ch => ch.title === title)
          if (existingIndex >= 0) {
            toc[existingIndex].url = resolvedUrl
            seenUrls.add(resolvedUrl)
          }
          return
        }

        seenUrls.add(resolvedUrl)
        seenTitles.add(title)

        // 应用简繁转换到章节标题
        if (targetLanguage && sourceLanguage && sourceLanguage !== targetLanguage) {
          title = convertChinese(title, sourceLanguage, targetLanguage)
        }

        toc.push({
          bookId: this.rule.name,
          title,
          url: resolvedUrl,
          order: toc.length + 1,
        })
      })

      if (items.length === 0 && pageIndex === 0) {
        log.scraper.warn(`TOC items empty: ${page.url}`)
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
   * @param chapterUrl 章节页面 URL
   * @param targetLanguage 目标语言（可选），用于简繁转换
   * @param chapterTitle 章节标题（可选），用于从正文移除重复标题
   */
  async getChapterContent(chapterUrl: string, targetLanguage?: ChineseLocale, chapterTitle?: string): Promise<string> {
    const chapterRule = this.rule.chapter
    const baseUri = chapterRule.baseUri || this.rule.url
    const sourceLanguage = this.rule.language as ChineseLocale || "cn"

    if (chapterRule.pagination) {
      return this.fetchPaginatedChapterContent(chapterUrl, baseUri, sourceLanguage, targetLanguage, chapterTitle)
    }

    const html = await this.fetchHtml(chapterUrl, "get", undefined, { baseUri })
    const doc = new DOMParser().parseFromString(html, "text/html")

    let content = this.parseContent(doc, chapterRule.content, "html", undefined, baseUri)
    if (!content) {
      throw new Error("正文内容为空")
    }

    content = this.applyChapterFilters(content, chapterTitle)
    content = this.formatChapterContent(content)

    // 应用简繁转换
    if (targetLanguage && sourceLanguage !== targetLanguage) {
      content = convertChinese(content, sourceLanguage, targetLanguage)
    }

    return content
  }

  private async fetchPaginatedChapterContent(
    startUrl: string,
    baseUri: string,
    sourceLanguage?: ChineseLocale,
    targetLanguage?: ChineseLocale,
    chapterTitle?: string,
  ): Promise<string> {
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

    let content = this.applyChapterFilters(merged, chapterTitle)
    content = this.formatChapterContent(content)

    // 应用简繁转换
    if (targetLanguage && sourceLanguage && sourceLanguage !== targetLanguage) {
      content = convertChinese(content, sourceLanguage, targetLanguage)
    }

    return content
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

  /**
   * 章节内容过滤
   */
  private applyChapterFilters(content: string, chapterTitle?: string) {
    let filtered = content

    // 1. 不可见字符过滤（对齐 CrawlUtils.cleanInvisibleChars）
    //    控制字符(\p{C})、行分隔符(\p{Zl})、段落分隔符(\p{Zp})
    // eslint-disable-next-line regexp/no-dupe-characters-character-class
    filtered = filtered.replace(/[\p{C}\p{Zl}\p{Zp}]/gu, "")

    // 2. HTML 实体过滤（移除 &nbsp; 等会导致 iBooks 报错的实体）
    filtered = filtered.replace(/&[^;]+;/g, "")

    // 3. 标签过滤（对齐 HtmlUtil.removeHtmlTag: 移除标签但保留内容）
    if (this.rule.chapter.filterTag) {
      const tags = this.rule.chapter.filterTag.split(/\s+/)
      const temp = document.createElement("div")
      temp.innerHTML = filtered

      tags.forEach((tag) => {
        if (!tag.trim())
          return
        try {
          // unwrap 标签（移除标签但保留文本内容），而非删除整个元素
          temp.querySelectorAll(tag.trim()).forEach((el) => {
            const parent = el.parentNode
            if (!parent)
              return
            while (el.firstChild) {
              parent.insertBefore(el.firstChild, el)
            }
            parent.removeChild(el)
          })
        }
        catch {
          // ignore invalid selectors
        }
      })

      filtered = temp.innerHTML
    }

    // 4. 文本过滤（整个 filterTxt 作为单一正则）
    if (this.rule.chapter.filterTxt) {
      try {
        const regex = new RegExp(this.rule.chapter.filterTxt, "g")
        filtered = filtered.replace(regex, "")
      }
      catch {
        // 正则无效时作为纯文本移除
        filtered = filtered.split(this.rule.chapter.filterTxt).join("")
      }
    }

    // 5. 空白规范化（对齐 StrUtil.cleanBlank）
    filtered = filtered.replace(/\s+/g, " ")

    // 6. 重复标题移除（从正文开头移除章节标题）
    if (chapterTitle) {
      const escaped = chapterTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      const titleRegex = new RegExp(`^\\s*${escaped}\\s*`)
      filtered = filtered.replace(titleRegex, "")
    }

    // 7. 空标签清理（对齐 HtmlUtil.cleanEmptyTag）
    filtered = filtered.replace(/<(\w)[^>]*>\s*<\/\1>/g, "")

    return filtered
  }

  private formatChapterContent(content: string) {
    const cleaned = this.clearAllAttributes(content)
    const chapterRule = this.rule.chapter

    if (chapterRule.paragraphTagClosed) {
      // 使用 .*? 而非 [\s\S]*?（不跨行匹配）
      return cleaned.replace(/<(?!p\b)([^>]+)>(.*?)<\/\1>/g, "<p>$2</p>")
    }

    const splitter = new RegExp(chapterRule.paragraphTag || "<br>+", "g")
    const parts = cleaned.split(splitter)
    return parts
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => `<p>${part}</p>`)
      .join("")
  }

  /**
   * 清除所有 HTML 属性并规范化空白（对齐 JsoupUtils.clearAllAttributes + StrUtil.cleanBlank）
   */
  private clearAllAttributes(html: string) {
    const temp = document.createElement("div")
    temp.innerHTML = html

    temp.querySelectorAll("*").forEach((el) => {
      for (const attr of Array.from(el.attributes)) {
        el.removeAttribute(attr.name)
      }
    })

    // 移除所有多余空白字符
    return temp.innerHTML.replace(/\s+/g, " ").trim()
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
