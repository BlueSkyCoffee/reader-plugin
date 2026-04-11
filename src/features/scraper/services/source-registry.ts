import type { ScraperRule } from "@/types/novel"
import { SOURCE_RULES } from "./source-rules"

export function getSourceRules(): ScraperRule[] {
  return SOURCE_RULES
}

export function getSourceRuleById(ruleId: string): ScraperRule | null {
  return SOURCE_RULES.find(rule => rule.id === ruleId) ?? null
}

export function getSourceRuleByUrl(url: string): ScraperRule | null {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "")
    return SOURCE_RULES.find((rule) => {
      try {
        const ruleHost = new URL(rule.url).hostname.replace(/^www\./, "")
        return ruleHost === host
      }
      catch {
        return false
      }
    }) ?? null
  }
  catch {
    return null
  }
}
