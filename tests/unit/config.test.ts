import { describe, expect, it } from "vitest"
import { DEFAULT_USER_SETTINGS, userSettingsSchema } from "@/types/config"

describe("user settings schema", () => {
  it("accepts the default settings", () => {
    const parsed = userSettingsSchema.safeParse(DEFAULT_USER_SETTINGS)
    expect(parsed.success).toBe(true)
  })

  it("fills missing nested readerStyle values", () => {
    const parsed = userSettingsSchema.parse({
      readerStyle: { accent: "#ff0000" },
    })
    expect(parsed.readerStyle.accent).toBe("#ff0000")
    expect(parsed.readerStyle.background).toBe("#ffffff")
  })
})
