import { Icon } from "@iconify/react"
import { HelpCircle, PanelRight } from "lucide-react"
import { browser } from "wxt/browser"
import { ModeToggle } from "@/components/app/mode-toggle"
import { MoreMenu } from "@/components/app/more-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { version } from "../../../package.json"

interface PopupLayoutProps {
  header?: React.ReactNode
  children: React.ReactNode
}

async function openSidePanel() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId })
    }
  }
  catch (error) {
    console.error("打开侧边栏失败:", error)
  }
}

export function PopupLayout({ header, children }: PopupLayoutProps) {
  return (
    <>
      <div className="bg-background flex flex-col gap-3 px-4 pt-4 pb-3">
        {/* 头部 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold leading-tight">Reader</h1>
            <Badge variant="secondary" className="text-[9px]">Beta</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => openSidePanel()}
              aria-label={browser.i18n.getMessage("popup_sidePanel")}
            >
              <PanelRight />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => browser.runtime.openOptionsPage()}
              aria-label={browser.i18n.getMessage("settings_help")}
            >
              <HelpCircle />
            </Button>
            <ModeToggle />
          </div>
        </div>

        {header}

        {/* 内容区域 */}
        {children}
      </div>

      {/* 底部 */}
      <div className="flex items-center justify-between bg-muted/50 px-3 py-1.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
          onClick={() => browser.runtime.openOptionsPage()}
        >
          <Icon icon="tabler:settings" className="size-3.5" strokeWidth={1.6} />
          {browser.i18n.getMessage("popup_options")}
        </Button>
        <span className="text-[10px] text-muted-foreground">
          v
          {version}
        </span>
        <MoreMenu />
      </div>
    </>
  )
}
