/**
 * 路由常量定义
 */

import type { NavigationItem, RouteConfig } from "../types"
import { i18n } from "@/shared/i18n"
import { AboutPage } from "../pages/about"
import { BookshelfPage } from "../pages/bookshelf"
import { DownloadPage } from "../pages/download"
import { GeneralPage } from "../pages/general"
import { HelpPage } from "../pages/help"
import { LightNovelPage } from "../pages/lightnovel"
import { ReaderPage } from "../pages/reader"
import { RulesPage } from "../pages/rules"
import { SearchPage } from "../pages/search"

/**
 * 导航项配置
 * 用于侧边栏导航菜单
 */
export const NAVIGATION_ITEMS: NavigationItem[] = [
  // 小说阅读组
  {
    path: "/",
    label: "我的书架",
    icon: "lucide:library",
    group: "reading",
  },
  {
    path: "/search",
    label: "全网搜索",
    icon: "lucide:search",
    group: "reading",
  },
  {
    path: "/downloads",
    label: "下载管理",
    icon: "lucide:download",
    group: "reading",
  },
  {
    path: "/lightnovel",
    label: "轻小说下载",
    icon: "lucide:book-open",
    group: "reading",
  },
  {
    path: "/rules",
    label: "书源规则",
    icon: "lucide:book-key",
    group: "reading",
  },
  // 设置组
  {
    path: "/settings/general",
    label: i18n.t("settings.general"),
    icon: "tabler:adjustments-horizontal",
    group: "settings",
  },
  {
    path: "/settings/help",
    label: i18n.t("settings.help"),
    icon: "lucide:help-circle",
    group: "settings",
  },
  {
    path: "/settings/about",
    label: i18n.t("settings.about"),
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
