import { describe, expect, it } from "vitest"
import { DEFAULT_RULES } from "@/features/scraper/services/default-rules"

describe("default scraper rules", () => {
  it("exports a non-empty rule set", () => {
    expect(DEFAULT_RULES.length).toBeGreaterThan(0)
  })

  it("has required fields per rule", () => {
    for (const rule of DEFAULT_RULES) {
      expect(rule.id).toBeTruthy()
      expect(rule.name).toBeTruthy()
      expect(rule.url).toMatch(/\/$/)
      expect(rule.book).toBeTruthy()
      expect(rule.toc).toBeTruthy()
      expect(rule.chapter).toBeTruthy()
    }
  })
})
