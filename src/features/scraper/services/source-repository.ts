import type { ScraperRule } from "@/types/novel"
import JSON5 from "json5"
import { requestMessage } from "@/shared/infra/messaging"
import { StorageManager } from "@/shared/infra/storage"
import { SOURCE_RULES } from "./source-rules"

export type RuleListener = (rules: ScraperRule[]) => void

export interface RuleImportResult {
  added: number
  updated: number
  total: number
}

export class SourceRuleRepository {
  private rules: ScraperRule[] = []
  private listeners = new Set<RuleListener>()

  async initialize() {
    const stored = await StorageManager.getRules()
    this.rules = stored.length > 0 ? stored : SOURCE_RULES
    if (stored.length === 0) {
      await StorageManager.saveRules(this.rules)
    }
    return this.getSnapshot()
  }

  getSnapshot() {
    return [...this.rules]
  }

  subscribe(listener: RuleListener) {
    this.listeners.add(listener)
    listener(this.getSnapshot())
    return () => this.listeners.delete(listener)
  }

  async refreshFromStorage() {
    this.rules = await StorageManager.getRules()
    this.notify()
    return this.getSnapshot()
  }

  async refreshFromRemote(url: string) {
    const text = await requestMessage("fetchHtml", { url })
    const parsed = this.parseRulePayload(text)
    return this.mergeRules(parsed)
  }

  async replaceRules(nextRules: ScraperRule[]) {
    this.rules = [...nextRules]
    await StorageManager.saveRules(this.rules)
    this.notify()
    return this.getSnapshot()
  }

  async mergeRules(incoming: ScraperRule[]) {
    const { merged, added, updated } = this.mergeByIdentity(this.rules, incoming)
    await this.replaceRules(merged)
    return { added, updated, total: merged.length } satisfies RuleImportResult
  }

  parseRulePayload(raw: string): ScraperRule[] {
    const payload = JSON5.parse(raw)
    if (Array.isArray(payload)) {
      const rules = payload as ScraperRule[]
      this.assertValidRules(rules)
      return rules
    }
    if (payload && typeof payload === "object") {
      const rule = payload as ScraperRule
      this.assertValidRules([rule])
      return [rule]
    }
    return []
  }

  private mergeByIdentity(existing: ScraperRule[], incoming: ScraperRule[]) {
    const merged = [...existing]
    let added = 0
    let updated = 0

    for (const rule of incoming) {
      const existingIndex = merged.findIndex((item) => {
        if (rule.id && item.id === rule.id) {
          return true
        }
        return item.url === rule.url
      })

      if (existingIndex >= 0) {
        merged[existingIndex] = { ...merged[existingIndex], ...rule }
        updated += 1
      }
      else {
        merged.push(rule)
        added += 1
      }
    }

    return { merged, added, updated }
  }

  private notify() {
    const snapshot = this.getSnapshot()
    this.listeners.forEach(listener => listener(snapshot))
  }

  private assertValidRules(rules: ScraperRule[]) {
    const errors: string[] = []
    rules.forEach((rule, index) => {
      const prefix = rule.name ? `"${rule.name}"` : `#${index + 1}`
      const error = this.validateRule(rule)
      if (error) {
        errors.push(`${prefix}: ${error}`)
      }
    })
    if (errors.length > 0) {
      throw new Error(`规则校验失败：${errors.join("; ")}`)
    }
  }

  private validateRule(rule: ScraperRule) {
    if (!rule.name?.trim()) {
      return "缺少 name"
    }
    if (!rule.url?.trim()) {
      return "缺少 url"
    }
    if (!rule.book?.bookName?.trim()) {
      return "缺少 book.bookName"
    }
    if (!rule.book?.author?.trim()) {
      return "缺少 book.author"
    }
    if (!rule.toc?.item?.trim()) {
      return "缺少 toc.item"
    }
    if (!rule.chapter?.content?.trim()) {
      return "缺少 chapter.content"
    }
    return null
  }
}
