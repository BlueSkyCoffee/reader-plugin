/**
 * 路由常量定义
 */

import { browser } from "wxt/browser"
import type { NavigationItem, RouteConfig } from "@/types/navigation"
import { BookshelfPage } from "@/features/bookshelf/bookshelf-page"
import { DownloadPage } from "@/features/download/download-page"
import { LightNovelPage } from "@/features/lightnovel/lightnovel-page"
import { ReaderPage } from "@/features/reader/reader-page"
import { RulesPage } from "@/features/rules/rules-page"
import { SearchPage } from "@/features/search/search-page"
import { AboutPage } from "@/features/settings/about-page"
import { GeneralPage } from "@/features/settings/general-page"
import { HelpPage } from "@/features/settings/help-page"

/**
 * 导航项配置
 * 用于侧边栏导航菜单
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  // 小说阅读组
  {
    path: "/",
    label: browser.i18n.getMessage("nav_bookshelf"),
    icon: "lucide:library",
    group: "reading",
  },
  {
    path: "/search",
    label: browser.i18n.getMessage("nav_search"),
    icon: "lucide:search",
    group: "reading",
  },
  {
    path: "/downloads",
    label: browser.i18n.getMessage("nav_downloads"),
    icon: "lucide:download",
    group: "reading",
  },
  {
    path: "/lightnovel",
    label: browser.i18n.getMessage("nav_lightnovel"),
    icon: "lucide:book-open",
    group: "reading",
  },
  {
    path: "/rules",
    label: browser.i18n.getMessage("nav_rules"),
    icon: "lucide:book-key",
    group: "reading",
  },
  // 设置组
  {
    path: "/settings/general",
    label: browser.i18n.getMessage("settings_general"),
    icon: "tabler:adjustments-horizontal",
    group: "settings",
  },
  {
    path: "/settings/help",
    label: browser.i18n.getMessage("settings_help"),
    icon: "lucide:help-circle",
    group: "settings",
  },
  {
    path: "/settings/about",
    label: browser.i18n.getMessage("settings_about"),
    icon: "lucide:info",
    group: "settings",
  },
]

/**
 * 路由配置
 * 用于路由映射
 */
export const ROUTE_CONFIG: RouteConfig[] = [
  { path: "/", component: BookshelfPage },
  { path: "/search", component: SearchPage },
  { path: "/downloads", component: DownloadPage },
  { path: "/lightnovel", component: LightNovelPage },
  { path: "/rules", component: RulesPage },
  { path: "/settings/general", component: GeneralPage },
  { path: "/settings/help", component: HelpPage },
  { path: "/settings/about", component: AboutPage },
  { path: "/reader", component: ReaderPage },
] as const

/**
 * 按分组组织的导航项
 */
export const NAVIGATION_GROUPS = {
  reading: NAVIGATION_ITEMS.filter(item => item.group === "reading"),
  settings: NAVIGATION_ITEMS.filter(item => item.group === "settings"),
} as const
