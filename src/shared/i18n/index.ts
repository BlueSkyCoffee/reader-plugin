import { browser } from "wxt/browser"

const FALLBACK_MESSAGES: Record<string, string> = {
  "popup.options": "设置",
  "popup.tagline": "书源搜索、轻小说打包与阅读管理",
  "popup.quickAccess": "快速入口",
  "popup.search": "搜索",
  "popup.library": "书架",
  "popup.downloads": "下载",
  "popup.lightnovel": "轻小说",
  "popup.rules": "书源",
  "popup.help": "帮助",
  "popup.settings": "设置",
  "popup.more.title": "更多",
  "popup.more.help": "帮助中心",
  "popup.more.project": "项目主页",
  "popup.more.feedback": "问题反馈",
  "settings.general": "通用设置",
  "settings.help": "帮助中心",
  "settings.about": "关于",
  "help.title": "帮助中心",
  "help.description": "常见问题、使用指南与排错建议",
  "help.toc.title": "文档导航",
  "help.toc.desc": "按需跳转到对应章节",
}

function resolveMessage(key: string, params?: Record<string, string | number>): string {
  const getMessage = browser?.i18n?.getMessage as ((messageName: string) => string) | undefined
  const raw = getMessage?.(key)
  const message = raw || FALLBACK_MESSAGES[key] || key
  if (!params) {
    return message
  }
  return Object.entries(params).reduce((acc, [name, value]) => {
    return acc.replaceAll(`{${name}}`, String(value))
  }, message)
}

export const i18n = {
  t: resolveMessage,
}
