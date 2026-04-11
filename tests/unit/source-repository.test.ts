import { describe, expect, it } from "vitest"
import { SourceRuleRepository } from "@/features/scraper/services"

describe("source rule repository", () => {
  it("rejects invalid rule payloads", () => {
    const repo = new SourceRuleRepository()
    const payload = JSON.stringify({
      url: "",
      name: "",
      book: { bookName: "", author: "" },
      toc: { item: "" },
      chapter: { content: "" },
    })

    expect(() => repo.parseRulePayload(payload)).toThrow("规则校验失败")
  })
})
