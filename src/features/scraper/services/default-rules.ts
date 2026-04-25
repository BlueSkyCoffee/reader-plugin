import type { ScraperRule } from "@/types/novel"
import { SOURCE_RULES } from "./source-rules"

/**
 * 默认书源规则配置
 * 同步自 demo 项目的规则集合
 */
export const DEFAULT_RULES: ScraperRule[] = SOURCE_RULES

/**
 * 内置小说书源规则库
 */
export const BUILTIN_RULES: ScraperRule[] = SOURCE_RULES

const DEFAULT_RULE_ID_SET = new Set(DEFAULT_RULES.map(rule => rule.id))

export function isDefaultRule(ruleId: string) {
  return DEFAULT_RULE_ID_SET.has(ruleId)
}
