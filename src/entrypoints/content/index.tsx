import type { Chapter } from "@/types/novel"
import { defineContentScript } from "#imports"
import { Provider, useAtom } from "jotai"
import * as React from "react"
import ReactDOM from "react-dom/client"
import { browser } from "wxt/browser"
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root"
import { PageErrorBoundary } from "@/components/app/error-boundary"
import { STORAGE_KEYS } from "@/constants/storage"
import { ParserProvider } from "@/features/lightnovel/services"
import { ContentDisplay, ReaderBar, ReaderControls } from "@/features/reader"
import { ScraperEngine } from "@/features/scraper/services"
import { db } from "@/lib/db"
import { StorageManager } from "@/lib/storage"
import { activeBookIdAtom, currentChapterIndexAtom, scrollPositionAtom, settingsAtom } from "@/state/store"
import { DEFAULT_USER_SETTINGS } from "@/types/config"
import { log } from "@/utils/logger"
import { ShortcutManager } from "@/utils/shortcut-manager"
import "@/assets/styles/theme.css"

export default defineContentScript({
  matches: ["<all_urls>"],
  cssInjectionMode: "ui",
  async main(context) {
    const ui = await createShadowRootUi(context, {
      name: "web-novel-reader",
      position: "modal",
      zIndex: 2147483647,
      isolateEvents: true,
      onMount: (container, _shadow, shadowHost) => {
        container.id = "reader-root"
        container.style.pointerEvents = "none"
        shadowHost.style.pointerEvents = "none"

        const root = ReactDOM.createRoot(container)
        root.render(
          <Provider>
            <PageErrorBoundary>
              <ReaderApp />
            </PageErrorBoundary>
          </Provider>,
        )

        return root
      },
      onRemove: root => root?.unmount(),
    })

    ui.mount()
  },
})

function ReaderApp() {
  const [settings, setSettings] = useAtom(settingsAtom)
  const [activeBookId, setActiveBookId] = useAtom(activeBookIdAtom)
  const [currentChapterIndex, setCurrentChapterIndex] = useAtom(currentChapterIndexAtom)
  const [, setScrollPosition] = useAtom(scrollPositionAtom)
  const [chapters, setChapters] = React.useState<Chapter[]>([])
  const [isFetching, setIsFetching] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(true)
  const [isExcluded, setIsExcluded] = React.useState(false)

  React.useEffect(() => {
    const checkExclusion = async () => {
      const currentDomain = window.location.hostname
      const storedSettings = await StorageManager.getSettings()
      setSettings(storedSettings)
      setIsExcluded(storedSettings.excludedSites?.includes(currentDomain) ?? false)
    }
    void checkExclusion()
  }, [setSettings])

  React.useEffect(() => {
    const handleShowReader = (event: Event) => {
      const customEvent = event as CustomEvent<{
        bookId: string
        chapterIndex?: number
        scroll?: number
        scrollPosition?: number
      }>

      setActiveBookId(customEvent.detail.bookId)
      setCurrentChapterIndex(customEvent.detail.chapterIndex ?? 0)
      setScrollPosition(customEvent.detail.scrollPosition ?? customEvent.detail.scroll ?? 0)
      setIsVisible(true)
    }

    window.addEventListener("show-reader", handleShowReader)
    return () => window.removeEventListener("show-reader", handleShowReader)
  }, [setActiveBookId, setCurrentChapterIndex, setScrollPosition])

  React.useEffect(() => {
    const hydrateActiveSession = async () => {
      const activeId = await StorageManager.getActiveBookId()
      if (!activeId) {
        return
      }

      const session = await StorageManager.getActiveReaderSession()

      setActiveBookId(activeId)
      setCurrentChapterIndex(session?.chapterIndex ?? 0)
      setScrollPosition(session?.scroll ?? 0)
      setIsVisible(true)
    }

    void hydrateActiveSession()
  }, [setActiveBookId, setCurrentChapterIndex, setScrollPosition])

  React.useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, { newValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName !== "local") {
        return
      }

      const settingsChange = changes[STORAGE_KEYS.appSettings]
      if (settingsChange?.newValue) {
        void StorageManager.getSettings().then(setSettings)
      }
    }

    browser.storage.onChanged.addListener(handleStorageChange)
    return () => browser.storage.onChanged.removeListener(handleStorageChange)
  }, [setSettings])

  React.useEffect(() => {
    if (!isVisible || !activeBookId) {
      return
    }

    ShortcutManager.setupReaderShortcuts({
      nextPage: () => setScrollPosition(previousScroll => previousScroll + 100),
      prevPage: () => setScrollPosition(previousScroll => Math.max(0, previousScroll - 100)),
      nextChapter: () => setCurrentChapterIndex(index => Math.min(chapters.length - 1, index + 1)),
      prevChapter: () => setCurrentChapterIndex(index => Math.max(0, index - 1)),
      toggleReader: () => setIsVisible(visible => !visible),
    })

    return () => {
      ShortcutManager.unbindReaderShortcuts()
    }
  }, [activeBookId, chapters.length, isVisible, setCurrentChapterIndex, setScrollPosition])

  React.useEffect(() => {
    if (!activeBookId) {
      return
    }

    void db.chapters.where("bookId").equals(activeBookId).sortBy("order").then(setChapters)
  }, [activeBookId])

  React.useEffect(() => {
    const currentChapter = chapters[currentChapterIndex]
    if (!currentChapter || currentChapter.content || isFetching) {
      return
    }

    const fetchChapterContent = async () => {
      setIsFetching(true)

      try {
        const book = await db.books.get(activeBookId!)
        if (!book) {
          return
        }

        let content = ""
        if (book.sourceId) {
          const rule = await StorageManager.getRuleById(book.sourceId)
          if (rule) {
            const engine = new ScraperEngine(rule)
            content = await engine.getChapterContent(currentChapter.url)
          }
        }
        else if (book.source === "bili" || book.source === "wenku") {
          content = await ParserProvider.fetchChapter(book.source, currentChapter.url)
        }

        if (!content) {
          return
        }

        await db.chapters.update(currentChapter.id!, { content })
        setChapters((previousChapters) => {
          const nextChapters = [...previousChapters]
          nextChapters[currentChapterIndex] = { ...currentChapter, content }
          return nextChapters
        })
      }
      catch (error) {
        log.content.error("Fetch chapter content failed", error)
      }
      finally {
        setIsFetching(false)
      }
    }

    void fetchChapterContent()
  }, [activeBookId, chapters, currentChapterIndex, isFetching])

  const resolvedSettings = React.useMemo(() => ({
    ...DEFAULT_USER_SETTINGS,
    ...settings,
    readerStyle: {
      ...DEFAULT_USER_SETTINGS.readerStyle,
      ...settings.readerStyle,
    },
  }), [settings])

  const shouldRenderReader = !isExcluded && !!activeBookId && isVisible

  useReaderPageInset(
    resolvedSettings.position,
    resolvedSettings.readerStyle.barHeight,
    shouldRenderReader,
  )

  if (!shouldRenderReader) {
    return null
  }

  const currentChapter = chapters[currentChapterIndex]
  const displayText = currentChapter?.content || (isFetching ? "Loading..." : "No content")

  return (
    <ReaderBar position={resolvedSettings.position} styleConfig={resolvedSettings.readerStyle}>
      <ContentDisplay
        text={displayText}
        isFetching={isFetching}
        primaryColor={resolvedSettings.readerStyle.accent}
        fontSize={resolvedSettings.fontSize}
        lineHeight={resolvedSettings.lineHeight}
      />
      <ReaderControls
        percent="0"
        currentIndex={currentChapterIndex}
        totalChapters={chapters.length}
        onPrev={() => setCurrentChapterIndex(index => Math.max(0, index - 1))}
        onNext={() => setCurrentChapterIndex(index => Math.min(chapters.length - 1, index + 1))}
      />
    </ReaderBar>
  )
}

function useReaderPageInset(
  position: typeof DEFAULT_USER_SETTINGS.position,
  barHeight: number,
  enabled: boolean,
) {
  const restoreRef = React.useRef<(() => void) | null>(null)

  React.useEffect(() => {
    restoreRef.current?.()
    restoreRef.current = null

    if (!enabled || position === "floating") {
      return
    }

    const side = position === "top" ? "Top" : "Bottom"
    const body = document.body
    const html = document.documentElement
    const bodyPaddingKey = `padding${side}` as "paddingTop" | "paddingBottom"
    const scrollPaddingKey = `scrollPadding${side}` as "scrollPaddingTop" | "scrollPaddingBottom"
    const originalBodyPadding = body.style[bodyPaddingKey]
    const originalHtmlScrollPadding = html.style[scrollPaddingKey]
    const computedPadding = Number.parseFloat(getComputedStyle(body)[bodyPaddingKey]) || 0
    const computedScrollPadding = Number.parseFloat(getComputedStyle(html)[scrollPaddingKey]) || 0
    const height = Math.max(0, barHeight)

    body.style[bodyPaddingKey] = `${computedPadding + height}px`
    html.style[scrollPaddingKey] = `${computedScrollPadding + height}px`

    restoreRef.current = () => {
      body.style[bodyPaddingKey] = originalBodyPadding
      html.style[scrollPaddingKey] = originalHtmlScrollPadding
    }

    return () => {
      restoreRef.current?.()
      restoreRef.current = null
    }
  }, [barHeight, enabled, position])
}
