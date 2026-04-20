import type { Book, Chapter, ScraperRule, SearchResult } from "@/types/novel"

/**
 * Mock book data for testing
 */
export const mockBooks: Book[] = [
  {
    id: "book-fixture-1",
    title: "测试小说一",
    author: "作者A",
    source: "custom",
    sourceId: "rule-fixture-1",
    sourceName: "测试书源",
    addedAt: 1700000000000,
    totalChapters: 100,
    cover: "https://example.com/cover1.jpg",
    description: "这是一本测试小说的简介。",
    status: "连载中",
  },
  {
    id: "book-fixture-2",
    title: "测试小说二",
    author: "作者B",
    source: "bili",
    sourceId: "bili",
    sourceName: "哔哩轻小说",
    addedAt: 1700100000000,
    totalChapters: 50,
    cover: "https://example.com/cover2.jpg",
    description: "第二本测试小说。",
    status: "已完结",
    progress: {
      chapterIndex: 10,
      scroll: 500,
    },
  },
  {
    id: "book-fixture-3",
    title: "测试小说三",
    author: "作者C",
    source: "wenku",
    sourceId: "wenku",
    sourceName: "轻小说文库",
    addedAt: 1700200000000,
    totalChapters: 200,
    cover: "https://example.com/cover3.jpg",
    description: "第三本测试小说。",
    status: "连载中",
  },
]

/**
 * Mock chapter data for testing
 */
export const mockChapters: Chapter[] = [
  {
    bookId: "book-fixture-1",
    title: "第一章 开始",
    url: "https://example.com/book1/ch1",
    content: "<p>这是第一章的内容。</p><p>故事从这里开始...</p>",
    order: 1,
  },
  {
    bookId: "book-fixture-1",
    title: "第二章 发展",
    url: "https://example.com/book1/ch2",
    content: "<p>第二章的内容。</p><p>情节继续发展...</p>",
    order: 2,
  },
  {
    bookId: "book-fixture-1",
    title: "第三章 高潮",
    url: "https://example.com/book1/ch3",
    content: "<p>第三章的内容。</p><p>故事进入高潮...</p>",
    order: 3,
  },
  {
    bookId: "book-fixture-2",
    title: "序章",
    url: "https://example.com/book2/ch0",
    content: "<p>序章内容。</p>",
    order: 1,
  },
  {
    bookId: "book-fixture-2",
    title: "第一章",
    url: "https://example.com/book2/ch1",
    content: "<p>第一章正文。</p>",
    order: 2,
  },
]

/**
 * Mock scraper rules for testing
 */
export const mockRules: ScraperRule[] = [
  {
    id: "rule-fixture-1",
    name: "测试书源A",
    url: "https://test-source-a.com",
    comment: "用于测试的书源规则",
    disabled: false,
    search: {
      url: "https://test-source-a.com/search?q=%s",
      method: "get",
      result: ".search-result-item",
      bookName: ".book-name",
      author: ".author",
      latestChapter: ".latest-chapter",
      lastUpdateTime: ".update-time",
    },
    book: {
      bookName: ".book-title",
      author: ".book-author",
      intro: ".book-intro",
      coverUrl: ".book-cover img@src",
      category: ".book-category",
      status: ".book-status",
    },
    toc: {
      url: "https://test-source-a.com/toc/{bookId}",
      item: ".chapter-list a",
      isDesc: false,
    },
    chapter: {
      content: ".chapter-content",
      title: ".chapter-title",
      filterTxt: "广告|推广",
    },
  },
  {
    id: "rule-fixture-2",
    name: "测试书源B（禁用）",
    url: "https://test-source-b.com",
    comment: "已禁用的书源",
    disabled: true,
    search: {
      url: "https://test-source-b.com/search?keyword=%s",
      method: "post",
      data: "searchkey=%s",
      result: "#result-list > li",
      bookName: ".title",
      author: ".author-name",
    },
    book: {
      bookName: "h1.book-title",
      author: ".info .author",
      intro: "#intro",
    },
    toc: {
      item: ".toc a",
    },
    chapter: {
      content: "#content",
    },
  },
  {
    id: "rule-fixture-pagination",
    name: "测试书源（分页）",
    url: "https://test-pagination.com",
    disabled: false,
    search: {
      url: "https://test-pagination.com/search?key=%s",
      method: "get",
      result: ".item",
      bookName: ".name",
      author: ".author",
      pagination: true,
      nextPage: ".next-page",
    },
    book: {
      bookName: ".title",
      author: ".author",
      intro: ".intro",
    },
    toc: {
      item: ".chapter",
      pagination: true,
      nextPage: ".next",
    },
    chapter: {
      content: ".content",
      pagination: true,
      nextPage: ".next-chapter",
    },
  },
]

/**
 * Mock search results for testing
 */
export const mockSearchResults: SearchResult[] = [
  {
    sourceId: "rule-fixture-1",
    url: "https://test-source-a.com/book/12345",
    bookName: "搜索结果小说一",
    author: "搜索作者A",
    latestChapter: "第100章 最新",
    lastUpdateTime: "2024-01-01",
    category: "玄幻",
    status: "连载中",
  },
  {
    sourceId: "rule-fixture-1",
    url: "https://test-source-a.com/book/67890",
    bookName: "搜索结果小说二",
    author: "搜索作者B",
    latestChapter: "第50章 大结局",
    lastUpdateTime: "2023-12-15",
    category: "都市",
    status: "已完结",
  },
]

/**
 * Mock HTML content for scraper testing
 */
export const mockHtmlContent = {
  searchPage: `
    <html>
      <body>
        <div class="search-result-item">
          <a class="book-name" href="/book/12345">测试搜索结果书名</a>
          <span class="author">测试作者</span>
          <span class="latest-chapter">最新章节：第100章</span>
          <span class="update-time">2024-01-01</span>
        </div>
        <div class="search-result-item">
          <a class="book-name" href="/book/67890">另一本测试书</a>
          <span class="author">另一位作者</span>
          <span class="latest-chapter">完结</span>
          <span class="update-time">2023-12-01</span>
        </div>
      </body>
    </html>
  `,

  bookDetailPage: `
    <html>
      <body>
        <h1 class="book-title">测试书籍详情</h1>
        <div class="book-author">测试作者详情</div>
        <div id="intro">这是一本书的详细介绍内容。</div>
        <img class="book-cover" src="/images/cover.jpg" />
        <span class="book-category">奇幻</span>
        <span class="book-status">连载中</span>
      </body>
    </html>
  `,

  tocPage: `
    <html>
      <body>
        <div class="chapter-list">
          <a href="/chapter/1">第一章</a>
          <a href="/chapter/2">第二章</a>
          <a href="/chapter/3">第三章</a>
          <a href="/chapter/4">第四章</a>
          <a href="/chapter/5">第五章</a>
        </div>
      </body>
    </html>
  `,

  chapterPage: `
    <html>
      <body>
        <h2 class="chapter-title">第一章 标题</h2>
        <div class="chapter-content">
          <p>这是正文段落一。</p>
          <p>这是正文段落二。</p>
          <p>广告内容需要被过滤。</p>
          <p>这是正文段落三。</p>
        </div>
      </body>
    </html>
  `,
}

/**
 * Mock user settings for testing
 */
export const mockUserSettings = {
  theme: "system",
  readerStyle: {
    fontFamily: "system-ui",
    fontSize: 16,
    lineHeight: 1.6,
    backgroundColor: "#ffffff",
    textColor: "#333333",
  },
  concurrentDownloads: 5,
  autoUpdateRules: true,
  shortcuts: {
    "next-chapter": ["ArrowRight"],
    "prev-chapter": ["ArrowLeft"],
    "toggle-reader": ["Ctrl", "R"],
  },
}

/**
 * Mock download records for testing
 */
export const mockDownloadRecords = [
  {
    id: "download-fixture-1",
    bookId: "book-fixture-1",
    title: "测试小说一",
    author: "作者A",
    format: "epub" as const,
    fileSize: 1024000,
    downloadedAt: 1700000000000,
    fileName: "测试小说一.epub",
    chapterCount: 100,
    status: "success" as const,
    sourceUrl: "https://example.com/book1",
  },
  {
    id: "download-fixture-2",
    bookId: "book-fixture-2",
    title: "测试小说二",
    author: "作者B",
    format: "epub" as const,
    fileSize: 512000,
    downloadedAt: 1700100000000,
    fileName: "测试小说二.epub",
    chapterCount: 50,
    status: "success" as const,
    sourceUrl: "https://example.com/book2",
  },
  {
    id: "download-fixture-failed",
    bookId: "book-fixture-3",
    title: "下载失败的小说",
    author: "作者C",
    format: "epub" as const,
    fileSize: 0,
    downloadedAt: 1700200000000,
    fileName: "失败.epub",
    chapterCount: 0,
    status: "failed" as const,
    errorMessage: "网络连接失败",
    sourceUrl: "https://example.com/book3",
  },
]
