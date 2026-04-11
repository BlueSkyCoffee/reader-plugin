import { describe, expect, it } from "vitest"
import { LanguageDetector } from "@/utils/language-detector"

describe("language detector", () => {
  it("returns unknown for very short text", () => {
    expect(LanguageDetector.detect("hi")).toBe("unknown")
  })

  it("detects English text", () => {
    const code = LanguageDetector.detect("This is a simple English sentence.")
    expect(code).toBe("eng")
  })

  it("detects Chinese text via isChinese", () => {
    expect(LanguageDetector.isChinese("这是中文文本")).toBe(true)
  })
})
