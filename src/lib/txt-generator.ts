import type { Book, Chapter } from "@/types/novel"
import { i18n } from "#imports"
import { saveAs } from "file-saver"
import { log } from "@/utils/logger"

/**
 * TXT 生成器服务
 * 生成纯文本格式的小说文件，段落缩进使用全角空格
 */
export class TxtGenerator {
  private book: Book
  private chapters: Chapter[]

  constructor(book: Book, chapters: Chapter[]) {
    this.book = book
    this.chapters = chapters
  }

  /**
   * 生成并下载 TXT 文件
   */
  async generateAndDownload(): Promise<void> {
    const lines: string[] = []

    // 书籍信息头
    lines.push(`${this.book.title}`)
    if (this.book.author) {
      lines.push(`${i18n.t("common_author")}: ${this.book.author}`)
    }
    if (this.book.description) {
      lines.push(`${this.book.description}`)
    }
    lines.push("")
    lines.push("=".repeat(40))
    lines.push("")

    // 目录
    lines.push(`${i18n.t("epub_toc_title")}`)
    lines.push("")
    this.chapters.forEach((chapter, index) => {
      lines.push(`${index + 1}. ${chapter.title}`)
    })
    lines.push("")
    lines.push("=".repeat(40))
    lines.push("")

    // 章节内容
    for (const chapter of this.chapters) {
      lines.push(chapter.title)
      lines.push("")

      const content = chapter.content || ""
      const paragraphs = this.extractParagraphs(content)

      for (const para of paragraphs) {
        // 全角空格缩进
        lines.push(`　　${para}`) // eslint-disable-line no-irregular-whitespace
      }

      lines.push("")
      lines.push("=".repeat(40))
      lines.push("")
    }

    const text = lines.join("\n")
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    saveAs(blob, `${this.book.title}.txt`)
    log.epub.info("TXT file generated", this.book.title)
  }

  /**
   * 从 HTML 内容中提取段落文本
   */
  private extractParagraphs(html: string): string[] {
    if (!html)
      return []

    // 如果是 HTML 标签格式，提取 <p> 标签内容
    if (html.includes("<p") || html.includes("<div")) {
      const temp = document.createElement("div")
      temp.innerHTML = html
      const paragraphs: string[] = []

      temp.querySelectorAll("p, div").forEach((el) => {
        const text = el.textContent?.trim()
        if (text) {
          paragraphs.push(text)
        }
      })

      // 如果没有找到 p/div 标签，按换行分割
      if (paragraphs.length === 0) {
        const text = temp.textContent?.trim() || ""
        return text.split(/\n+/).map(s => s.trim()).filter(Boolean)
      }

      return paragraphs
    }

    // 纯文本格式，按换行分割
    return html.split(/\n+/).map(s => s.trim()).filter(Boolean)
  }
}
