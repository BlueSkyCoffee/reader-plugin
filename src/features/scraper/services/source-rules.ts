import type { ScraperRule } from "@/types/novel"

import cloudflareRules from "./source-rules/cloudflare.json"
import mainRules from "./source-rules/main.json"
import noSearchRules from "./source-rules/no-search.json"
import proxyRequiredRules from "./source-rules/proxy-required.json"
import rateLimitRules from "./source-rules/rate-limit.json"

interface RawRule {
  url: string
  name: string
  comment?: string
  language?: string
  needProxy?: boolean
  disabled?: boolean
  ignoreSsl?: boolean
  search?: RawSearch
  book?: RawBook
  toc?: RawToc
  chapter?: RawChapter
  crawl?: RawCrawl
}

interface RawSearch {
  disabled?: boolean
  baseUri?: string
  timeout?: number
  url: string
  method?: "get" | "post" | string
  data?: string
  cookies?: string
  headers?: Record<string, string>
  result: string
  bookName: string
  author?: string
  category?: string
  latestChapter?: string
  lastUpdateTime?: string
  status?: string
  wordCount?: string
  pagination?: boolean
  nextPage?: string
  urlBuilder?: "quanben5"
  responseType?: "html" | "quanben5"
}

interface RawBook {
  baseUri?: string
  timeout?: number
  url?: string
  bookName?: string
  author?: string
  intro?: string
  category?: string
  coverUrl?: string
  latestChapter?: string
  lastUpdateTime?: string
  status?: string
}

interface RawToc {
  baseUri?: string
  timeout?: number
  url?: string
  list?: string
  item: string
  isDesc?: boolean
  pagination?: boolean
  nextPage?: string
}

interface RawChapter {
  baseUri?: string
  timeout?: number
  title?: string
  content: string
  paragraphTagClosed?: boolean
  paragraphTag?: string
  filterTxt?: string
  filterTag?: string
  pagination?: boolean
  nextPage?: string
  nextPageInJs?: string
  nextChapterLink?: string
}

interface RawCrawl {
  concurrency?: number
  minInterval?: number
  maxInterval?: number
  maxAttempts?: number
  retryMinInterval?: number
  retryMaxInterval?: number
}

const META_BOOK_NAME = "meta[property=\"og:novel:book_name\"]"
const META_AUTHOR = "meta[property=\"og:novel:author\"]"
const META_INTRO = "meta[name=\"description\"]"
const META_CATEGORY = "meta[property=\"og:novel:category\"]"
const META_COVER_URL = "meta[property=\"og:image\"]"
const META_LATEST_CHAPTER = "meta[property=\"og:novel:latest_chapter_name\"]"
const META_LAST_UPDATE_TIME = "meta[property=\"og:novel:update_time\"]"
const META_STATUS = "meta[property=\"og:novel:status\"]"

const RAW_RULES: RawRule[] = [
  ...mainRules,
  ...rateLimitRules,
  ...proxyRequiredRules,
  ...noSearchRules,
  ...cloudflareRules,
]

const NORMALIZED_RULES = normalizeRules(RAW_RULES)

export const SOURCE_RULES: ScraperRule[] = NORMALIZED_RULES

function normalizeRules(rules: RawRule[]): ScraperRule[] {
  const deduped = new Map<string, RawRule>()

  for (const rule of rules) {
    const key = normalizeUrl(rule.url)
    if (!deduped.has(key)) {
      deduped.set(key, rule)
      continue
    }

    const existing = deduped.get(key)!
    deduped.set(key, mergeRule(existing, rule))
  }

  const ids = new Map<string, number>()

  return [...deduped.values()].map((rule) => {
    const id = buildRuleId(rule, ids)
    const baseUrl = normalizeUrl(rule.url)

    const normalizedSearch = rule.search
      ? {
          ...rule.search,
          baseUri: rule.search.baseUri || baseUrl,
          method: normalizeMethod(rule.search.method),
        }
      : undefined

    const normalizedBook = {
      ...rule.book,
      baseUri: rule.book?.baseUri || baseUrl,
      bookName: rule.book?.bookName || META_BOOK_NAME,
      author: rule.book?.author || META_AUTHOR,
      intro: rule.book?.intro || META_INTRO,
      category: rule.book?.category || META_CATEGORY,
      coverUrl: rule.book?.coverUrl || META_COVER_URL,
      latestChapter: rule.book?.latestChapter || META_LATEST_CHAPTER,
      lastUpdateTime: rule.book?.lastUpdateTime || META_LAST_UPDATE_TIME,
      status: rule.book?.status || META_STATUS,
      url: rule.book?.url,
    }

    const normalizedToc = {
      ...rule.toc,
      baseUri: rule.toc?.baseUri || baseUrl,
      item: rule.toc?.item || "",
    }

    const normalizedChapter = {
      ...rule.chapter,
      baseUri: rule.chapter?.baseUri || baseUrl,
      paragraphTagClosed: rule.chapter?.paragraphTagClosed ?? false,
      paragraphTag: rule.chapter?.paragraphTag || "<br>+",
      content: rule.chapter?.content || "",
      title: rule.chapter?.title,
    }

    const normalized: ScraperRule = {
      id,
      name: rule.name,
      url: baseUrl,
      comment: rule.comment,
      language: rule.language,
      needProxy: rule.needProxy,
      disabled: rule.disabled,
      ignoreSsl: rule.ignoreSsl,
      crawl: rule.crawl,
      search: normalizedSearch,
      book: normalizedBook,
      toc: normalizedToc,
      chapter: normalizedChapter,
    }

    if (normalizedSearch?.url.includes("quanben5.com") || rule.name.includes("全本小说网")) {
      const search = normalized.search
      if (!search) {
        return normalized
      }

      normalized.search = {
        ...search,
        url: search.url,
        urlBuilder: "quanben5",
        responseType: "quanben5",
        headers: {
          Referer: "https://quanben5.com/search.html",
          ...(search.headers || {}),
        },
      }
    }

    return normalized
  })
}

function normalizeMethod(method?: string): "get" | "post" {
  if (!method)
    return "get"
  return method.toLowerCase() === "post" ? "post" : "get"
}

function normalizeUrl(url: string) {
  if (!url)
    return url
  const hasTrailingSlash = url.endsWith("/")
  return hasTrailingSlash ? url : `${url}/`
}

function mergeRule(base: RawRule, incoming: RawRule): RawRule {
  return {
    ...base,
    ...incoming,
    search: mergeSection(base.search, incoming.search),
    book: mergeSection(base.book, incoming.book),
    toc: mergeSection(base.toc, incoming.toc),
    chapter: mergeSection(base.chapter, incoming.chapter),
    crawl: mergeSection(base.crawl, incoming.crawl),
  }
}

function mergeSection<T extends object | undefined>(base?: T, incoming?: T): T | undefined {
  if (!base)
    return incoming
  if (!incoming)
    return base
  return { ...base, ...incoming }
}

function buildRuleId(rule: RawRule, ids: Map<string, number>) {
  const host = safeHostname(rule.url) || rule.name
  const slug = host
    .replace(/^www\./, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const count = (ids.get(slug) || 0) + 1
  ids.set(slug, count)

  return count === 1 ? slug : `${slug}-${count}`
}

function safeHostname(url: string) {
  try {
    return new URL(url).hostname
  }
  catch {
    return ""
  }
}
