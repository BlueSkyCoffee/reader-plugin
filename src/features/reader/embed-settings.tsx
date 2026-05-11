import { browser } from "wxt/browser"
import { useAtom } from "jotai"
import { BookOpenText, Eye, Move, Palette, Ruler } from "lucide-react"
import * as React from "react"
import { ConfigCard } from "@/components/settings/config-card"
import { SettingItem } from "@/components/settings/setting-item"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { settingsAtom } from "@/state/store"
import { DEFAULT_USER_SETTINGS } from "@/types/config"

interface ReaderThemePreset {
  name: string
  background: string
  foreground: string
  border: string
  accent: string
}

const READER_THEME_PRESETS: ReaderThemePreset[] = [
  { name: "默认", background: "#ffffff", foreground: "#0f172a", border: "#e2e8f0", accent: "#16a34a" },
  { name: "暗夜", background: "#1e293b", foreground: "#e2e8f0", border: "#334155", accent: "#38bdf8" },
  { name: "暖阳", background: "#fffbeb", foreground: "#451a03", border: "#fde68a", accent: "#f59e0b" },
  { name: "森林", background: "#f0fdf4", foreground: "#14532d", border: "#bbf7d0", accent: "#22c55e" },
  { name: "薰衣草", background: "#faf5ff", foreground: "#581c87", border: "#e9d5ff", accent: "#a855f7" },
  { name: "玫瑰", background: "#fff1f2", foreground: "#881337", border: "#fecdd3", accent: "#f43f5e" },
  { name: "深海", background: "#0c1222", foreground: "#cbd5e1", border: "#1e3a5f", accent: "#0ea5e9" },
  { name: "琥珀", background: "#fefce8", foreground: "#451a03", border: "#fef08a", accent: "#d97706" },
]

function findMatchingPreset(style: typeof DEFAULT_USER_SETTINGS.readerStyle): string | null {
  const preset = READER_THEME_PRESETS.find(
    p => p.background === style.background
      && p.foreground === style.foreground
      && p.border === style.border
      && p.accent === style.accent,
  )
  return preset?.name ?? null
}

function ReaderStylePreview({
  position,
  styleConfig,
  fontSize,
  lineHeight,
}: {
  position: "top" | "bottom" | "floating"
  styleConfig: typeof DEFAULT_USER_SETTINGS.readerStyle
  fontSize: number
  lineHeight: number
}) {
  const isFloating = position === "floating"
  const previewStyle: React.CSSProperties = {
    backgroundColor: styleConfig.background,
    color: styleConfig.foreground,
    borderColor: styleConfig.border,
    borderRadius: isFloating ? styleConfig.radius : 0,
    opacity: styleConfig.opacity,
    width: isFloating ? styleConfig.floatingWidth : "100%",
    height: isFloating ? styleConfig.floatingHeight : styleConfig.barHeight,
  }

  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
      <div className="text-xs text-muted-foreground mb-2">{browser.i18n.getMessage("settings_readerEmbed_preview_label")}</div>
      <div className="relative flex justify-center">
        <div className="border shadow-sm flex flex-col" style={previewStyle}>
          {isFloating && (
            <div className="flex items-center justify-between border-b px-3 py-1 text-[10px] uppercase tracking-wide">
              <span className="opacity-70">{browser.i18n.getMessage("settings_readerEmbed_preview_dragZone")}</span>
              <span className="opacity-50">{browser.i18n.getMessage("settings_readerEmbed_preview_floatingMode")}</span>
            </div>
          )}
          <div
            className="flex-1 min-h-0 overflow-hidden px-3 py-2 font-mono"
            style={{ fontSize: `${fontSize}px`, lineHeight }}
          >
            <p className="line-clamp-3">
              {browser.i18n.getMessage("settings_readerEmbed_preview_content")}
            </p>
          </div>
          <div className="border-t px-3 py-1 text-[10px] flex items-center justify-between">
            <span>1 / 80</span>
            <span style={{ color: styleConfig.accent }}>{browser.i18n.getMessage("settings_readerEmbed_preview_nav")}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function ReaderEmbedSettings() {
  const [settings, setSettings] = useAtom(settingsAtom)
  const resolvedStyle = React.useMemo(
    () => ({
      ...DEFAULT_USER_SETTINGS.readerStyle,
      ...settings.readerStyle,
    }),
    [settings.readerStyle],
  )

  const updateSettings = (patch: Partial<typeof settings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  const updateReaderStyle = (patch: Partial<typeof resolvedStyle>) => {
    setSettings(prev => ({
      ...prev,
      readerStyle: {
        ...DEFAULT_USER_SETTINGS.readerStyle,
        ...prev.readerStyle,
        ...patch,
      },
    }))
  }

  const fontSize = settings.fontSize ?? DEFAULT_USER_SETTINGS.fontSize
  const lineHeight = settings.lineHeight ?? DEFAULT_USER_SETTINGS.lineHeight
  const currentPreset = findMatchingPreset(resolvedStyle)

  const handleThemeChange = (presetName: string) => {
    const preset = READER_THEME_PRESETS.find(p => p.name === presetName)
    if (preset) {
      updateReaderStyle({
        background: preset.background,
        foreground: preset.foreground,
        border: preset.border,
        accent: preset.accent,
      })
    }
  }

  return (
    <ConfigCard
      title={browser.i18n.getMessage("settings_readerEmbed_title")}
      description={browser.i18n.getMessage("settings_readerEmbed_desc")}
    >
      <SettingItem
        icon={<Eye className="size-4" />}
        title={browser.i18n.getMessage("settings_readerEmbed_autoShow_title")}
        description={browser.i18n.getMessage("settings_readerEmbed_autoShow_desc")}
      >
        <Switch
          checked={settings.autoShowReader ?? false}
          onCheckedChange={checked => updateSettings({ autoShowReader: checked })}
        />
      </SettingItem>

      <SettingItem
        icon={<Move className="size-4" />}
        title={browser.i18n.getMessage("settings_readerEmbed_position_title")}
        description={browser.i18n.getMessage("settings_readerEmbed_position_desc")}
      >
        <Tabs
          value={settings.position ?? DEFAULT_USER_SETTINGS.position}
          onValueChange={value => updateSettings({ position: value as typeof settings.position })}
          className="w-[260px]"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="top">{browser.i18n.getMessage("settings_readerEmbed_position_top")}</TabsTrigger>
            <TabsTrigger value="bottom">{browser.i18n.getMessage("settings_readerEmbed_position_bottom")}</TabsTrigger>
            <TabsTrigger value="floating">{browser.i18n.getMessage("settings_readerEmbed_position_floating")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </SettingItem>

      <SettingItem
        icon={<Palette className="size-4" />}
        title={browser.i18n.getMessage("settings_readerEmbed_colors_title")}
        description={browser.i18n.getMessage("settings_readerEmbed_colors_desc")}
      >
        <Select value={currentPreset ?? ""} onValueChange={handleThemeChange}>
          <SelectTrigger className="w-[260px]">
            <SelectValue placeholder={browser.i18n.getMessage("settings_readerEmbed_colors_placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {READER_THEME_PRESETS.map(preset => (
              <SelectItem key={preset.name} value={preset.name}>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    <span className="size-3 rounded-full border" style={{ backgroundColor: preset.background }} />
                    <span className="size-3 rounded-full border" style={{ backgroundColor: preset.foreground }} />
                    <span className="size-3 rounded-full border" style={{ backgroundColor: preset.accent }} />
                  </div>
                  <span>{preset.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </SettingItem>

      <SettingItem
        icon={<Palette className="size-4" />}
        title={browser.i18n.getMessage("settings_readerEmbed_styleAdjust_title")}
        description={browser.i18n.getMessage("settings_readerEmbed_styleAdjust_desc")}
      >
        <div className="flex flex-col gap-4 w-[260px]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{browser.i18n.getMessage("settings_readerEmbed_colors_opacity")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{resolvedStyle.opacity}</span>
            </div>
            <Slider
              min={0.5}
              max={1}
              step={0.01}
              value={[resolvedStyle.opacity]}
              onValueChange={([v]) => updateReaderStyle({ opacity: v })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{browser.i18n.getMessage("settings_readerEmbed_colors_radius")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {resolvedStyle.radius}
                px
              </span>
            </div>
            <Slider
              min={0}
              max={24}
              step={1}
              value={[resolvedStyle.radius]}
              onValueChange={([v]) => updateReaderStyle({ radius: v })}
            />
          </div>
        </div>
      </SettingItem>

      <SettingItem
        icon={<Ruler className="size-4" />}
        title={browser.i18n.getMessage("settings_readerEmbed_size_title")}
        description={browser.i18n.getMessage("settings_readerEmbed_size_desc")}
      >
        <div className="flex flex-col gap-4 w-[260px]">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{browser.i18n.getMessage("settings_readerEmbed_size_barHeight")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {resolvedStyle.barHeight}
                px
              </span>
            </div>
            <Slider
              min={48}
              max={240}
              step={4}
              value={[resolvedStyle.barHeight]}
              onValueChange={([v]) => updateReaderStyle({ barHeight: v })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{browser.i18n.getMessage("settings_readerEmbed_size_floatingWidth")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {resolvedStyle.floatingWidth}
                px
              </span>
            </div>
            <Slider
              min={260}
              max={720}
              step={10}
              value={[resolvedStyle.floatingWidth]}
              onValueChange={([v]) => updateReaderStyle({ floatingWidth: v })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{browser.i18n.getMessage("settings_readerEmbed_size_floatingHeight")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {resolvedStyle.floatingHeight}
                px
              </span>
            </div>
            <Slider
              min={120}
              max={520}
              step={10}
              value={[resolvedStyle.floatingHeight]}
              onValueChange={([v]) => updateReaderStyle({ floatingHeight: v })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{browser.i18n.getMessage("settings_readerEmbed_size_fontSize")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {fontSize}
                px
              </span>
            </div>
            <Slider
              min={12}
              max={30}
              step={1}
              value={[fontSize]}
              onValueChange={([v]) => updateSettings({ fontSize: v })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">{browser.i18n.getMessage("settings_readerEmbed_size_lineHeight")}</Label>
              <span className="text-xs text-muted-foreground tabular-nums">{lineHeight}</span>
            </div>
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={[lineHeight]}
              onValueChange={([v]) => updateSettings({ lineHeight: v })}
            />
          </div>
        </div>
      </SettingItem>

      <SettingItem
        icon={<BookOpenText className="size-4" />}
        title={browser.i18n.getMessage("settings_readerEmbed_preview_title")}
        description={browser.i18n.getMessage("settings_readerEmbed_preview_desc")}
      >
        <ReaderStylePreview
          position={settings.position ?? DEFAULT_USER_SETTINGS.position}
          styleConfig={resolvedStyle}
          fontSize={fontSize}
          lineHeight={lineHeight}
        />
      </SettingItem>
    </ConfigCard>
  )
}
