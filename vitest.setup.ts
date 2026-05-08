import { vi } from "vitest"
import "@testing-library/jest-dom"

// Mock @wxt-dev/i18n for tests since fake-browser doesn't implement i18n.getMessage
vi.mock("@wxt-dev/i18n", () => ({
  createI18n: () => ({
    t: (key: string, substitutions?: string[] | number) => {
      if (typeof substitutions === "number") return String(substitutions)
      if (Array.isArray(substitutions) && substitutions.length > 0) {
        let result = key
        substitutions.forEach((sub, i) => {
          result = result.replace(`$${i + 1}`, String(sub))
        })
        return result
      }
      return key
    },
  }),
}))

// JSDom + Vitest don't play well with each other. Long story short - default
// TextEncoder produces Uint8Array objects that are _different_ from the global
// Uint8Array objects, so some functions that compare their types explode.
// https://github.com/vitest-dev/vitest/issues/4043#issuecomment-1905172846
class ESBuildAndJSDOMCompatibleTextEncoder extends TextEncoder {
  constructor() {
    super()
  }

  encode(input: string) {
    if (typeof input !== "string") {
      throw new TypeError("`input` must be a string")
    }

    const decodedURI = decodeURIComponent(encodeURIComponent(input))
    const arr = new Uint8Array(decodedURI.length)
    const chars = decodedURI.split("")
    for (let i = 0; i < chars.length; i++) {
      arr[i] = decodedURI[i].charCodeAt(0)
    }
    return arr
  }
}

globalThis.TextEncoder = ESBuildAndJSDOMCompatibleTextEncoder
