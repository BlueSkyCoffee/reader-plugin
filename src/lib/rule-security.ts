/**
 * 规则安全验证器
 * 用于检测导入规则中的潜在危险代码
 */

import type { ScraperRule } from "@/types/novel"
import { log } from "@/utils/logger"

const RULE_JS_SEPARATOR = "@js:"

/**
 * 安全警告信息
 */
export interface SecurityWarning {
  level: "critical" | "warning" | "info"
  message: string
  field: string
  jsCode: string
  pattern: string
}

/**
 * 危险的 JavaScript 模式列表
 * 这些模式可能被用于恶意目的
 */
const DANGEROUS_JS_PATTERNS = [
  // 网络访问
  /\bfetch\s*\(/i,
  /\bXMLHttpRequest\b/i,
  /\bWebSocket\b/i,
  /\bimport\s*\(/i,
  /\brequire\s*\(/i,

  // 数据访问
  /\blocalStorage\b/i,
  /\bsessionStorage\b/i,
  /\bindexedDB\b/i,
  /\bcookieStore\b/i,
  /\bdocument\.cookie\b/i,

  // DOM 操作（潜在 XSS）
  /\bdocument\.write\b/i,
  /\bdocument\.writeln\b/i,
  /\binnerHTML\s*=/i,
  /\bouterHTML\s*=/i,

  // 代码执行
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /\bnew\s+Function\b/i,
  /\bsetTimeout\s*\([^)]*,\s*\d+\s*\)/i, // setTimeout with string
  /\bsetInterval\s*\([^)]*,\s*\d+\s*\)/i, // setInterval with string

  // 扩展 API
  /\bchrome\s*\./i,
  /\bbrowser\s*\./i,
  /\bwindow\.postMessage\b/i,

  // 导航
  /\blocation\s*\./i,
  /\bwindow\.location\b/i,
  /\bwindow\.open\b/i,
  /\bwindow\.close\b/i,

  // 消息传递
  /\bpostMessage\s*\(/i,

  // 安全风险
  /\bwindow\b/i,
  /\bdocument\b/i,
  /\bnavigator\b/i,
]

/**
 * 安全的 JavaScript 模式列表（白名单）
 * 这些是规则中常用的安全操作
 * 用于未来的白名单功能
 */
const _SAFE_JS_PATTERNS = [
  // 字符串操作
  /\br\.replace\b/,
  /\br\.replaceAll\b/,
  /\br\.match\b/,
  /\br\.matchAll\b/,
  /\br\.split\b/,
  /\br\.trim\b/,
  /\br\.substring\b/,
  /\br\.slice\b/,
  /\br\.toLowerCase\b/,
  /\br\.toUpperCase\b/,
  /\br\.indexOf\b/,
  /\br\.includes\b/,
  /\br\.startsWith\b/,
  /\br\.endsWith\b/,
  /\br\.length\b/,
  /\br\.charAt\b/,
  /\br\.charCodeAt\b/,
  /\bString\b/,
  /\bRegExp\b/,
  /\bJSON\b/,
  /\bMath\b/,
  /\bparseInt\b/,
  /\bparseFloat\b/,
  /\bNumber\b/,
  /\bBoolean\b/,
  /\bArray\b/,
  /\bObject\b/,
  /\bencodeURIComponent\b/,
  /\bdecodeURIComponent\b/,
  /\bencodeURI\b/,
  /\bdecodeURI\b/,
]

/**
 * 提取规则中的所有 JavaScript 代码
 */
function extractJsCodeFromRule(rule: ScraperRule): Array<{ field: string, jsCode: string }> {
  const jsEntries: Array<{ field: string, jsCode: string }> = []

  function extractJs(query: string | undefined, field: string) {
    if (!query)
      return

    const jsIndex = query.indexOf(RULE_JS_SEPARATOR)
    if (jsIndex >= 0) {
      const jsCode = query.slice(jsIndex + RULE_JS_SEPARATOR.length)
      if (jsCode.trim()) {
        jsEntries.push({ field, jsCode })
      }
    }
  }

  // 搜索规则
  if (rule.search) {
    extractJs(rule.search.bookName, "search.bookName")
    extractJs(rule.search.author, "search.author")
    extractJs(rule.search.latestChapter, "search.latestChapter")
    extractJs(rule.search.lastUpdateTime, "search.lastUpdateTime")
    extractJs(rule.search.category, "search.category")
    extractJs(rule.search.status, "search.status")
    extractJs(rule.search.wordCount, "search.wordCount")
  }

  // 书籍规则
  if (rule.book) {
    extractJs(rule.book.bookName, "book.bookName")
    extractJs(rule.book.author, "book.author")
    extractJs(rule.book.intro, "book.intro")
    extractJs(rule.book.category, "book.category")
    extractJs(rule.book.coverUrl, "book.coverUrl")
    extractJs(rule.book.latestChapter, "book.latestChapter")
    extractJs(rule.book.lastUpdateTime, "book.lastUpdateTime")
    extractJs(rule.book.status, "book.status")
    extractJs(rule.book.wordCount, "book.wordCount")
  }

  // 目录规则
  if (rule.toc) {
    extractJs(rule.toc.list, "toc.list")
    extractJs(rule.toc.nextPage, "toc.nextPage")
  }

  // 章节规则
  if (rule.chapter) {
    extractJs(rule.chapter.title, "chapter.title")
    extractJs(rule.chapter.content, "chapter.content")
    extractJs(rule.chapter.nextPage, "chapter.nextPage")
    extractJs(rule.chapter.nextPageInJs, "chapter.nextPageInJs")
    extractJs(rule.chapter.filterTxt, "chapter.filterTxt")
  }

  return jsEntries
}

/**
 * 检查 JavaScript 代码是否包含危险模式
 */
function checkJsCode(jsCode: string): SecurityWarning[] {
  const warnings: SecurityWarning[] = []

  for (const pattern of DANGEROUS_JS_PATTERNS) {
    if (pattern.test(jsCode)) {
      // 判断危险程度
      let level: "critical" | "warning" | "info" = "warning"

      // 高危模式
      if (
        /\bfetch\s*\(/i.test(jsCode)
        || /\beval\s*\(/i.test(jsCode)
        || /\bFunction\s*\(/i.test(jsCode)
        || /\blocalStorage\b/i.test(jsCode)
        || /\bindexedDB\b/i.test(jsCode)
        || /\bchrome\s*\./i.test(jsCode)
        || /\bbrowser\s*\./i.test(jsCode)
        || /\bdocument\.cookie\b/i.test(jsCode)
        || /\bpostMessage\s*\(/i.test(jsCode)
      ) {
        level = "critical"
      }

      warnings.push({
        level,
        message: getDangerousPatternMessage(pattern),
        field: "",
        jsCode,
        pattern: pattern.source,
      })
    }
  }

  return warnings
}

/**
 * 获取危险模式的描述信息
 */
function getDangerousPatternMessage(pattern: RegExp): string {
  const patternSource = pattern.source

  // 网络相关
  if (patternSource.includes("fetch"))
    return "代码包含网络请求操作，可能发送数据到外部服务器"
  if (patternSource.includes("XMLHttpRequest"))
    return "代码包含 XMLHttpRequest，可能发送数据到外部服务器"
  if (patternSource.includes("WebSocket"))
    return "代码包含 WebSocket 操作，可能建立外部通信"
  if (patternSource.includes("import"))
    return "代码包含动态导入，可能加载外部模块"
  if (patternSource.includes("require"))
    return "代码包含 require，可能加载外部模块"

  // 数据存储
  if (patternSource.includes("localStorage"))
    return "代码访问 localStorage，可能读取或修改本地数据"
  if (patternSource.includes("sessionStorage"))
    return "代码访问 sessionStorage，可能读取会话数据"
  if (patternSource.includes("indexedDB"))
    return "代码访问 IndexedDB，可能读取或修改数据库"
  if (patternSource.includes("cookie"))
    return "代码访问 Cookie，可能读取敏感数据"

  // DOM 操作
  if (patternSource.includes("innerHTML") || patternSource.includes("outerHTML"))
    return "代码直接修改 DOM，存在 XSS 风险"
  if (patternSource.includes("document.write"))
    return "代码使用 document.write，存在 XSS 风险"

  // 代码执行
  if (patternSource.includes("eval"))
    return "代码包含 eval()，可执行任意代码"
  if (patternSource.includes("Function"))
    return "代码包含 Function()，可执行任意代码"
  if (patternSource.includes("setTimeout") || patternSource.includes("setInterval"))
    return "代码包含定时器字符串执行，可能执行任意代码"

  // 扩展 API
  if (patternSource.includes("chrome") || patternSource.includes("browser"))
    return "代码访问浏览器扩展 API，可能滥用扩展权限"
  if (patternSource.includes("postMessage"))
    return "代码包含 postMessage，可能跨上下文通信"

  // 导航
  if (patternSource.includes("location"))
    return "代码访问 location，可能重定向页面"
  if (patternSource.includes("window.open"))
    return "代码可打开新窗口，可能导致安全问题"

  return "代码包含潜在危险的操作"
}

/**
 * 验证规则安全性
 * @param rule 要验证的规则
 * @returns 安全警告列表
 */
export function validateRuleSecurity(rule: ScraperRule): SecurityWarning[] {
  const allWarnings: SecurityWarning[] = []

  const jsEntries = extractJsCodeFromRule(rule)

  for (const entry of jsEntries) {
    const warnings = checkJsCode(entry.jsCode)
    for (const warning of warnings) {
      allWarnings.push({
        ...warning,
        field: entry.field,
      })
    }
  }

  if (allWarnings.length > 0) {
    log.scraper.warn(`Rule "${rule.name}" contains ${allWarnings.length} security warnings`)
  }

  return allWarnings
}

/**
 * 批量验证规则安全性
 * @param rules 要验证的规则列表
 * @returns 包含警告的规则及其警告列表
 */
export function validateRulesSecurity(rules: ScraperRule[]): Map<string, SecurityWarning[]> {
  const results = new Map<string, SecurityWarning[]>()

  for (const rule of rules) {
    const warnings = validateRuleSecurity(rule)
    if (warnings.length > 0) {
      results.set(rule.id, warnings)
    }
  }

  return results
}

/**
 * 检查规则是否包含高危代码
 */
export function hasCriticalSecurityIssues(rule: ScraperRule): boolean {
  const warnings = validateRuleSecurity(rule)
  return warnings.some(w => w.level === "critical")
}

/**
 * 获取规则安全摘要（用于 UI 显示）
 */
export function getSecuritySummary(warnings: SecurityWarning[]): {
  critical: number
  warning: number
  info: number
  hasIssues: boolean
} {
  return {
    critical: warnings.filter(w => w.level === "critical").length,
    warning: warnings.filter(w => w.level === "warning").length,
    info: warnings.filter(w => w.level === "info").length,
    hasIssues: warnings.length > 0,
  }
}
