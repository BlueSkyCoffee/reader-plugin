import { Settings } from "lucide-react"
import { browser } from "wxt/browser"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface SidePanelLayoutProps {
  nav?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
}

export function SidePanelLayout({ nav, action, children }: SidePanelLayoutProps) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* 头部 */}
      <div className="flex items-center justify-between border-b px-3 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-bold leading-tight">Reader</h1>
          <Badge variant="secondary" className="text-[9px]">Beta</Badge>
        </div>
        <div className="flex items-center gap-1">
          {action}
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => {
              const url = browser.runtime.getURL("/options.html#/settings/general")
              void browser.tabs.create({ url })
            }}
          >
            <Settings className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* 标签导航 */}
      {nav && (
        <div className="border-b px-3 py-1.5 shrink-0">
          {nav}
        </div>
      )}

      {/* 内容 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
