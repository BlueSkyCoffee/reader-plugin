import { useCallback, useMemo } from "react"
import { useAtom } from "jotai"
import { settingsAtom } from "@/shared/state/store"
import { DEFAULT_SHORTCUTS, DEFAULT_USER_SETTINGS, type ShortcutConfig } from "@/types/config"

const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator?.platform ?? "")

const MODIFIER_KEYS = {
  ctrl: "Ctrl",
  shift: "Shift",
  alt: "Alt",
  meta: "Cmd",
} as const

const MODIFIER_ORDER = [
  MODIFIER_KEYS.meta,
  MODIFIER_KEYS.ctrl,
  MODIFIER_KEYS.shift,
  MODIFIER_KEYS.alt,
] as const

// 快捷键定义
export const SHORTCUT_DEFINITIONS = {
  open_search: {
    name: "打开搜索",
    description: "快速打开搜索功能",
  },
  open_settings: {
    name: "打开设置",
    description: "快速打开设置页面",
  },
  toggle_theme: {
    name: "切换主题",
    description: "在浅色和深色主题之间切换",
  },
  refresh_sources: {
    name: "刷新书源",
    description: "刷新所有书源数据",
  },
} as const

export function useShortcuts() {
  const [settings, setSettings] = useAtom(settingsAtom)

  const shortcuts = useMemo(() => {
    return settings.shortcuts ?? DEFAULT_USER_SETTINGS.shortcuts
  }, [settings.shortcuts])

  // 更新单个快捷键
  const updateShortcut = useCallback(
    (id: string, keys: string[]) => {
      setSettings(prev => ({
        ...prev,
        shortcuts: (prev.shortcuts ?? DEFAULT_USER_SETTINGS.shortcuts).map(s =>
          s.id === id ? { ...s, keys } : s,
        ),
      }))
    },
    [setSettings],
  )

  // 重置为默认快捷键
  const resetToDefaults = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      shortcuts: DEFAULT_SHORTCUTS.map(s => ({ id: s.id, keys: [...s.keys] })),
    }))
  }, [setSettings])

  // 获取快捷键配置
  const getShortcut = useCallback(
    (id: string) => {
      return shortcuts.find(s => s.id === id)
    },
    [shortcuts],
  )

  return {
    shortcuts,
    updateShortcut,
    resetToDefaults,
    getShortcut,
  }
}

// 检查按键组合是否有效
export function isValidKeyCombo(keys: string[]): boolean {
  if (keys.length === 0 || keys.length > 4)
    return false
  const validKeys = new Set([
    "Ctrl",
    "Cmd",
    "Shift",
    "Alt",
    ",",
    ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)), // A-Z
    ...Array.from({ length: 10 }, (_, i) => String(i)), // 0-9
    ...Array.from({ length: 12 }, (_, i) => `F${i + 1}`), // F1-F12
  ])
  return keys.every(k => validKeys.has(k))
}

export function normalizeKeyCombo(keys: string[]): string[] {
  const mapped = keys.map((key) => {
    if (IS_MAC && key === "Ctrl") {
      return MODIFIER_KEYS.meta
    }
    if (IS_MAC && key === "Meta") {
      return MODIFIER_KEYS.meta
    }
    if (!IS_MAC && key === "Cmd") {
      return MODIFIER_KEYS.ctrl
    }
    if (!IS_MAC && key === "Meta") {
      return MODIFIER_KEYS.ctrl
    }
    return key
  })

  const unique = Array.from(new Set(mapped))
  const modifiers = MODIFIER_ORDER.filter(mod => unique.includes(mod))
  const rest = unique.filter(key => !MODIFIER_ORDER.includes(key as typeof MODIFIER_ORDER[number]))

  return [...modifiers, ...rest]
}

export function formatKeyCombo(keys: string[]): string {
  const normalized = normalizeKeyCombo(keys)
  const parts = normalized.map((key) => {
    if (!IS_MAC) {
      return key
    }

    if (key === MODIFIER_KEYS.meta)
      return "⌘"
    if (key === MODIFIER_KEYS.shift)
      return "⇧"
    if (key === MODIFIER_KEYS.alt)
      return "⌥"
    if (key === MODIFIER_KEYS.ctrl)
      return "⌃"
    if (key === ",")
      return "，"
    return key
  })

  return IS_MAC ? parts.join("") : parts.join(" + ")
}

// 将键盘事件转换为快捷键组合
export function eventToKeyCombo(event: KeyboardEvent): string[] {
  const keys: string[] = []

  if (event.ctrlKey)
    keys.push(MODIFIER_KEYS.ctrl)
  if (event.shiftKey)
    keys.push(MODIFIER_KEYS.shift)
  if (event.altKey)
    keys.push(MODIFIER_KEYS.alt)
  if (event.metaKey)
    keys.push(MODIFIER_KEYS.meta)

  const key = event.key.toUpperCase()
  if (key.length === 1 && /[A-Z0-9]/.test(key)) {
    keys.push(key)
  }
  else if (event.key === ",") {
    keys.push(",")
  }
  else if (key.startsWith("F") && /F\d+/.test(key)) {
    keys.push(key)
  }

  return normalizeKeyCombo(keys)
}
