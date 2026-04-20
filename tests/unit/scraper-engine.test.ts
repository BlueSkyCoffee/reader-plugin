import type { ScraperRule } from "@/types/novel"
/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest"
import { ScraperEngine } from "@/features/scraper/services/engine"

const mockRule: ScraperRule = {
  id: "test-rule",
  name: "Test Rule",
  url: "https://example.com",
  search: {
    url: "https://example.com/search?q=%s",
    method: "get",
    result: ".result-item",
    bookName: ".book-name",
    author: ".author",
  },
  book: {
    bookName: ".book-title",
    author: ".book-author",
    intro: ".book-intro",
  },
  toc: {
    item: ".chapter-item",
  },
  chapter: {
    content: ".chapter-content",
  },
}

describe("scraperEngine", () => {
  describe("parseContent", () => {
    const engine = new ScraperEngine(mockRule)

    it("extracts text content from CSS selector", () => {
      const html = `
        <html>
          <body>
            <div class="chapter-content">
              <p>This is the chapter content.</p>
            </div>
          </body>
        </html>
      `
      const result = engine.parseContent(html, ".chapter-content", "text")
      expect(result).toBe("This is the chapter content.")
    })

    it("extracts HTML content", () => {
      const html = `
        <html>
          <body>
            <div class="chapter-content">
              <p>Paragraph 1</p>
              <p>Paragraph 2</p>
            </div>
          </body>
        </html>
      `
      const result = engine.parseContent(html, ".chapter-content", "html")
      expect(result).toContain("<p>Paragraph 1</p>")
      expect(result).toContain("<p>Paragraph 2</p>")
    })

    it("extracts attribute value", () => {
      const html = `
        <html>
          <body>
            <a class="chapter-item" href="/chapter/1">Chapter 1</a>
          </body>
        </html>
      `
      const result = engine.parseContent(html, ".chapter-item", "attr", "href", "https://example.com")
      expect(result).toBe("https://example.com/chapter/1")
    })

    it("extracts meta content attribute", () => {
      const html = `
        <html>
          <head>
            <meta name="description" content="Book description here">
          </head>
        </html>
      `
      const result = engine.parseContent(html, "meta[name=description]", "text")
      expect(result).toBe("Book description here")
    })

    it("returns empty string for non-existent selector", () => {
      const html = `<html><body><div>Content</div></body></html>`
      const result = engine.parseContent(html, ".non-existent", "text")
      expect(result).toBe("")
    })

    it("resolves relative URLs with baseUri", () => {
      const html = `
        <html>
          <body>
            <img class="cover" src="/images/cover.jpg">
          </body>
        </html>
      `
      const result = engine.parseContent(html, ".cover", "attr", "src", "https://example.com/book/123")
      expect(result).toBe("https://example.com/images/cover.jpg")
    })

    it("extracts XPath selector", () => {
      const html = `
        <html>
          <body>
            <div class="content">
              <p>First paragraph</p>
              <p>Second paragraph</p>
            </div>
          </body>
        </html>
      `
      const result = engine.parseContent(html, "//div[@class='content']/p[1]", "text")
      expect(result).toBe("First paragraph")
    })

    it("handles empty query gracefully", () => {
      const html = `<html><body><div>Content</div></body></html>`
      const result = engine.parseContent(html, "", "text")
      expect(result).toBe("")
    })

    it("runs custom @js transformation", () => {
      const html = `
        <html>
          <body>
            <div class="chapter-content">Original text</div>
          </body>
        </html>
      `
      const result = engine.parseContent(html, ".chapter-content@js: r = r.toUpperCase()", "text")
      expect(result).toBe("ORIGINAL TEXT")
    })
  })

  describe("selectAll", () => {
    const engine = new ScraperEngine(mockRule)

    it("returns multiple elements for CSS selector", () => {
      const html = `
        <html>
          <body>
            <div class="result-item">Item 1</div>
            <div class="result-item">Item 2</div>
            <div class="result-item">Item 3</div>
          </body>
        </html>
      `
      const doc = new DOMParser().parseFromString(html, "text/html")
      // Access private method via type casting
      const elements = (engine as any).selectAll(doc, ".result-item")
      expect(elements.length).toBe(3)
    })

    it("returns empty array for non-existent selector", () => {
      const html = `<html><body><div>Content</div></body></html>`
      const doc = new DOMParser().parseFromString(html, "text/html")
      const elements = (engine as any).selectAll(doc, ".non-existent")
      expect(elements.length).toBe(0)
    })
  })
})
