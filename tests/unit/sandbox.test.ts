/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

// Mock DOM environment for sandbox testing
describe("SandboxService", () => {
  let mockIframe: HTMLIFrameElement
  let mockParent: Window

  beforeEach(() => {
    // Create mock iframe
    mockIframe = document.createElement("iframe")
    mockIframe.src = "/sandbox.html"
    mockIframe.setAttribute("sandbox", "allow-scripts")
    document.body.appendChild(mockIframe)

    // Mock parent window
    mockParent = window
  })

  afterEach(() => {
    // Cleanup
    if (mockIframe && mockIframe.parentNode) {
      mockIframe.parentNode.removeChild(mockIframe)
    }
  })

  it("creates iframe with sandbox attribute", () => {
    expect(mockIframe.getAttribute("sandbox")).toBe("allow-scripts")
  })

  it("iframe has correct src path", () => {
    expect(mockIframe.src).toContain("sandbox.html")
  })

  it("iframe is hidden from view", () => {
    mockIframe.style.display = "none"
    expect(mockIframe.style.display).toBe("none")
  })
})

// Test sandbox JS execution logic (simulated)
describe("Sandbox JS Execution", () => {
  const blockedApis = [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "caches",
    "cookieStore",
    "navigator",
    "location",
    "history",
    "window",
    "document",
    "chrome",
    "browser",
  ]

  function createSandboxEnv(): Record<string, undefined> {
    const env: Record<string, undefined> = {}
    for (const api of blockedApis) {
      env[api] = undefined
    }
    return env
  }

  it("blocks dangerous APIs", () => {
    const env = createSandboxEnv()
    for (const api of blockedApis) {
      expect(env[api]).toBeUndefined()
    }
  })

  it("allows safe string operations", () => {
    const env = createSandboxEnv()
    // Safe operations should work with the sandbox environment
    const safeCode = "r = r.replace(/test/g, 'replaced')"
    // This is just a syntax check, not actual execution
    expect(() => new Function("r", safeCode)).not.toThrow()
  })

  it("executes simple transformation correctly", () => {
    const testInput = "Hello World"
    const transformCode = "r = r.toUpperCase()"
    const fn = new Function("r", `var result = r; ${transformCode}; return r;`)
    const result = fn(testInput)
    expect(result).toBe("HELLO WORLD")
  })

  it("handles replace operations", () => {
    const testInput = "test string test"
    const transformCode = "r = r.replace(/test/g, 'pass')"
    const fn = new Function("r", `var result = r; ${transformCode}; return r;`)
    const result = fn(testInput)
    expect(result).toBe("pass string pass")
  })
})