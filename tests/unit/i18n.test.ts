import { describe, expect, it, vi } from "vitest"

describe("i18n", () => {
  async function loadI18n(mockedBrowser: any) {
    vi.resetModules()
    vi.doMock("wxt/browser", () => mockedBrowser)
    const { i18n } = await import("@/i18n")
    return i18n
  }

  it("falls back to local messages when browser i18n is unavailable", async () => {
    const i18n = await loadI18n({ browser: {} })
    expect(i18n.t("popup.options")).toBe("设置")
    expect(i18n.t("unknown.key")).toBe("unknown.key")
  })

  it("uses browser i18n when provided", async () => {
    const i18n = await loadI18n({
      browser: {
        i18n: {
          getMessage: (key: string) => (key === "popup_options" ? "Options" : ""),
        },
      },
    })
    expect(i18n.t("popup.options")).toBe("Options")
  })
})
