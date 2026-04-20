import { browser } from "wxt/browser"

import type { LocaleMessages } from "@/types/i18n"

// Import from public/_locales via alias - WXT copies public/ to extension root
// Used as fallback when browser.i18n API unavailable (tests, SSR)
import enMessages from "@locales/en/messages.json"
import zhMessages from "@locales/zh_CN/messages.json"

// Type assertion for imported JSON structure
const EN_MESSAGES = enMessages as LocaleMessages
const ZH_MESSAGES = zhMessages as LocaleMessages

// Convert JSON format { "key": { "message": "value" } } to flat Record<string, string>
function flattenMessages(messages: Record<string, { message: string }>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(messages).map(([key, value]) => [key, value.message]),
  )
}

function normalizeMessageKey(key: string): string {
  return key.replaceAll(".", "_")
}

const ZH_FALLBACK = flattenMessages(ZH_MESSAGES)
const EN_FALLBACK = flattenMessages(EN_MESSAGES)

// Detect user locale preference, fallback to zh_CN for Chinese users
function getPreferredFallback(): Record<string, string> {
  const lang = browser?.i18n?.getUILanguage?.() ?? navigator?.language ?? "zh-CN"
  // Chinese users get Chinese fallback, others get English
  if (lang.startsWith("zh")) {
    return ZH_FALLBACK
  }
  return EN_FALLBACK
}

function resolveMessage(key: string, params?: Record<string, string | number>): string {
  // Primary: use browser.i18n.getMessage (browser extension standard API)
  const getMessage = browser?.i18n?.getMessage as ((messageName: string) => string) | undefined
  const normalizedKey = normalizeMessageKey(key)
  const raw = getMessage?.(normalizedKey)

  // Fallback: use imported JSON messages when browser API unavailable (dev mode, SSR, etc.)
  const fallbackMessages = getPreferredFallback()
  const message = raw || fallbackMessages[normalizedKey] || fallbackMessages[key] || key

  if (!params) {
    return message
  }

  // Replace placeholders like {count}, {title}, etc. (Chrome extension placeholder syntax)
  return Object.entries(params).reduce((acc, [name, value]) => {
    return acc.replaceAll(`{${name}}`, String(value))
  }, message)
}

export const i18n = {
  t: resolveMessage,
}
