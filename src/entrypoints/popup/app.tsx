import { i18n } from "#imports"
import { Icon } from "@iconify/react"
import { BookOpen, Download, ExternalLink, HelpCircle, Library, Search, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { browser } from "wxt/browser"
import { ModeToggle } from "@/components/app/mode-toggle"
import { MoreMenu } from "@/components/app/more-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { NovelSearchCard } from "@/features/search"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"
import { version } from "../../../package.json"

interface ActiveBookInfo {
  bookId: string
  title: string
  author: string
  totalChapters: number
  chapterIndex: number
}

function App() {
  const [activeBook, setActiveBook] = useState<ActiveBookInfo | null>(null)
  const [isHttpPage, setIsHttpPage] = useState(false)

  const openOptions = (path: string) => {
    const url = browser.runtime.getURL(`/options.html#${path}`)
    return browser.tabs.create({ url })
  }

  useEffect(() => {
    const loadActiveBook = async () => {
      try {
        const session = await StorageManager.getActiveReaderSession()
        const activeBookId = await StorageManager.getActiveBookId()

        if (session && activeBookId) {
          setActiveBook({
            bookId: activeBookId,
            title: session.title,
            author: session.author,
            totalChapters: session.totalChapters,
            chapterIndex: session.chapterIndex,
          })
        }
      }
      catch (error) {
        log.popup.error("Load active book failed", error)
      }
    }

    const checkCurrentPage = async () => {
      try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
        if (tab?.url) {
          setIsHttpPage(tab.url.startsWith("http://") || tab.url.startsWith("https://"))
        }
      }
      catch (error) {
        log.popup.error("Check current page failed", error)
      }
    }

    void loadActiveBook()
    void checkCurrentPage()
  }, [])

  const handleOpenReader = async () => {
    if (!activeBook || !isHttpPage)
      return

    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id)
        return

      await browser.scripting.executeScript({
        target: { tabId: tab.id },
        func: (bookId, chapterIndex, scroll) => {
          window.dispatchEvent(new CustomEvent("show-reader", {
            detail: { bookId, chapterIndex, scroll },
          }))
        },
        args: [activeBook.bookId, activeBook.chapterIndex, 0],
      })
      window.close()
    }
    catch (error) {
      log.popup.error("Open reader failed", error)
    }
  }

  return (
    <>
      <div className="bg-background flex flex-col gap-4 px-6 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold leading-tight">Reader</h1>
              <Badge variant="secondary" className="text-[10px]">Beta</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-medium">
              {i18n.t("popup.tagline")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openOptions("/settings/help")}
              aria-label="帮助中心"
            >
              <HelpCircle className="size-4" />
            </Button>
            <ModeToggle />
          </div>
        </div>

        {activeBook && isHttpPage && (
          <div className="bg-muted/50 rounded-md p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold">{activeBook.title}</span>
                <span className="text-xs text-muted-foreground">
                  {activeBook.author}
                  {" · "}
                  {i18n.t("popup.reader.chapterProgress", [activeBook.chapterIndex + 1, activeBook.totalChapters])}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1"
                onClick={handleOpenReader}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {i18n.t("popup.reader.open")}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">
              {i18n.t("popup.quickAccess")}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => openOptions("/settings/general")}
            >
              {i18n.t("popup.settings")}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1"
              onClick={() => openOptions("/search")}
            >
              <Search className="w-3.5 h-3.5" />
              {i18n.t("popup.search")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1"
              onClick={() => openOptions("/")}
            >
              <Library className="w-3.5 h-3.5" />
              {i18n.t("popup.library")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1"
              onClick={() => openOptions("/downloads")}
            >
              <Download className="w-3.5 h-3.5" />
              {i18n.t("popup.downloads")}
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1"
              onClick={() => openOptions("/lightnovel")}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {i18n.t("popup.lightnovel")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1"
              onClick={() => openOptions("/rules")}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {i18n.t("popup.rules")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-xs gap-1"
              onClick={() => openOptions("/settings/help")}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {i18n.t("popup.help")}
            </Button>
          </div>
        </div>

        <Separator />

        <main className="w-full">
          <NovelSearchCard />
        </main>
      </div>

      <div className="flex items-center justify-between bg-neutral-200 px-2 py-1 dark:bg-neutral-800">
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
          onClick={() => browser.runtime.openOptionsPage()}
        >
          <Icon icon="tabler:settings" className="size-4" strokeWidth={1.6} />
          <span className="text-[13px] font-medium">
            {i18n.t("popup.options")}
          </span>
        </button>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          {version}
        </span>
        <MoreMenu />
      </div>
    </>
  )
}

export default App
