import JSON5 from "json5"
import ruleTemplateText from "./source-rules/rule-template.json5?raw"

export interface RuleTemplateSearch {
  disabled?: boolean
  baseUri?: string
  timeout?: number
  url: string
  method?: string
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
}

export interface RuleTemplateBook {
  baseUri?: string
  timeout?: number
  url?: string
  bookName: string
  author: string
  intro?: string
  category?: string
  coverUrl?: string
  latestChapter?: string
  lastUpdateTime?: string
  status?: string
}

export interface RuleTemplateToc {
  baseUri?: string
  timeout?: number
  url?: string
  list?: string
  item: string
  isDesc?: boolean
  pagination?: boolean
  nextPage?: string
}

export interface RuleTemplateChapter {
  baseUri?: string
  timeout?: number
  title: string
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

export interface RuleTemplateCrawl {
  concurrency?: number
  minInterval?: number
  maxInterval?: number
  maxAttempts?: number
  retryMinInterval?: number
  retryMaxInterval?: number
}

export interface RuleTemplate {
  url: string
  name: string
  comment?: string
  language?: string
  needProxy?: boolean
  disabled?: boolean
  ignoreSsl?: boolean
  search?: RuleTemplateSearch
  book: RuleTemplateBook
  toc: RuleTemplateToc
  chapter: RuleTemplateChapter
  crawl?: RuleTemplateCrawl
}

export function loadRuleTemplate(): RuleTemplate {
  return JSON5.parse(ruleTemplateText) as RuleTemplate
}
