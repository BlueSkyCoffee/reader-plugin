import { z } from "zod"

export const readerPositionSchema = z.enum(["top", "bottom", "floating"])

const defaultReaderStyle = {
  background: "#ffffff",
  foreground: "#0f172a",
  border: "#e2e8f0",
  accent: "#16a34a",
  opacity: 0.98,
  radius: 12,
  barHeight: 120,
  floatingWidth: 360,
  floatingHeight: 240,
} as const

export const readerStyleSchema = z.object({
  background: z.string().default("#ffffff"),
  foreground: z.string().default("#0f172a"),
  border: z.string().default("#e2e8f0"),
  accent: z.string().default("#16a34a"),
  opacity: z.number().min(0.5).max(1).default(0.98),
  radius: z.number().min(0).max(24).default(12),
  barHeight: z.number().min(48).max(240).default(120),
  floatingWidth: z.number().min(260).max(720).default(360),
  floatingHeight: z.number().min(120).max(520).default(240),
})

const themeSchema = z.preprocess(
  (value) => {
    if (value === "auto" || value === "default") {
      return "system"
    }
    return value
  },
  z.enum(["light", "dark", "system"]),
)

// 快捷键配置 schema
export const shortcutConfigSchema = z.object({
  id: z.string(),
  keys: z.array(z.string()),
})

// 默认快捷键配置
const IS_MAC = /Mac|iPhone|iPad|iPod/i.test(navigator?.platform ?? "")
export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  { id: "open_search", keys: [IS_MAC ? "Cmd" : "Ctrl", "K"] },
  { id: "open_settings", keys: [IS_MAC ? "Cmd" : "Ctrl", ","] },
  { id: "toggle_theme", keys: [IS_MAC ? "Cmd" : "Ctrl", "Shift", "L"] },
  { id: "refresh_sources", keys: [IS_MAC ? "Cmd" : "Ctrl", "R"] },
]

export const userSettingsSchema = z.object({
  theme: themeSchema.default("system"),
  readerTheme: z.string().default("default"),
  fontSize: z.number().min(12).max(30).default(16),
  lineHeight: z.number().min(1).max(3).default(1.6),
  position: readerPositionSchema.default("bottom"),
  readerStyle: readerStyleSchema.default(defaultReaderStyle),
  // 新增设置项
  concurrentDownloads: z.number().min(1).max(10).default(3),
  autoUpdateRules: z.boolean().default(true),
  shortcuts: z.array(shortcutConfigSchema).default(DEFAULT_SHORTCUTS),
})

export type ReaderPosition = z.infer<typeof readerPositionSchema>
export type ReaderStyle = z.infer<typeof readerStyleSchema>
export type ShortcutConfig = z.infer<typeof shortcutConfigSchema>
export type UserSettings = z.infer<typeof userSettingsSchema>

export const DEFAULT_USER_SETTINGS: UserSettings = userSettingsSchema.parse({})
