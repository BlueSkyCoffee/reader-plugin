import { Icon } from "@iconify/react"
import { BookOpen, Download, HelpCircle, Library, Search, ShieldCheck } from "lucide-react"
import { browser } from "wxt/browser"
import { NovelSearchCard } from "@/features/search"
import { ModeToggle } from "@/shared/components/mode-toggle"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { i18n } from "@/shared/i18n"
import { version } from "../../../package.json"
import { MoreMenu } from "./components/more-menu"

function App() {
  const openOptions = (path: string) => {
    const url = browser.runtime.getURL(`/options.html#${path}`)
    return browser.tabs.create({ url })
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
              <HelpCircle className="w-4 h-4" />
            </Button>
            <ModeToggle />
          </div>
        </div>

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
