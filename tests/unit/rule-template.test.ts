import { describe, expect, it } from "vitest"
import { loadRuleTemplate } from "@/features/scraper/services"

describe("rule template loader", () => {
  it("loads a template with required sections", () => {
    const template = loadRuleTemplate()
    expect(template.url).toBeDefined()
    expect(template.name).toBeDefined()
    expect(template.book).toBeDefined()
    expect(template.toc).toBeDefined()
    expect(template.chapter).toBeDefined()
  })
})
