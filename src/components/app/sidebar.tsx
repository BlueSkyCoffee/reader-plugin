/**
 * 应用侧边栏组件
 * 显示应用 Logo 和导航菜单
 */

import { browser } from "wxt/browser"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { SettingsNav } from "./settings-nav"

/**
 * 侧边栏 Logo 部分
 */
function SidebarLogo() {
  const version = browser.runtime.getManifest().version

  return (
    <div className="flex items-center gap-2 px-1 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <a
        href="#"
        className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        <span className="font-bold text-sm">R</span>
      </a>
      <div className="grid flex-1 text-left text-sm leading-tight ml-1 group-data-[collapsible=icon]:hidden">
        <span className="truncate font-medium">Reader</span>
        <span className="truncate text-xs text-muted-foreground">
          v
          {version}
        </span>
      </div>
    </div>
  )
}

/**
 * 应用侧边栏主组件
 */
export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="group-data-[state=expanded]:px-5 group-data-[state=expanded]:pt-4 transition-all pb-2">
        <SidebarLogo />
      </SidebarHeader>
      <SidebarContent className="group-data-[state=expanded]:px-2 transition-all">
        <SettingsNav />
      </SidebarContent>
    </Sidebar>
  )
}
