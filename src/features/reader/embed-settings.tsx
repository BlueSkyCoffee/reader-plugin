import { i18n } from "#imports"
import { useAtom } from "jotai"
import { BookOpenText, Move, Palette, Ruler } from "lucide-react"
import * as React from "react"
import { ConfigCard } from "@/components/settings/config-card"
import { SettingItem } from "@/components/settings/setting-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { settingsAtom } from "@/state/store"
import { DEFAULT_USER_SETTINGS } from "@/types/config"

const colorPattern = /^#(?:[0-9A-F]{3}){1,2}$/i

function normalizeColor(value: string, fallback: string) {
  return colorPattern.test(value) ? value : fallback
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
      <div className="text-xs text-muted-foreground mb-2">{i18n.t("settings.readerEmbed.preview.label")}</div>
      <div className="relative flex justify-center">
        <div className="border shadow-sm flex flex-col" style={previewStyle}>
          {isFloating && (
            <div className="flex items-center justify-between border-b px-3 py-1 text-[10px] uppercase tracking-wide">
              <span className="opacity-70">{i18n.t("settings.readerEmbed.preview.dragZone")}</span>
              <span className="opacity-50">{i18n.t("settings.readerEmbed.preview.floatingMode")}</span>
            </div>
          )}
          <div
            className="flex-1 min-h-0 overflow-hidden px-3 py-2 font-mono"
            style={{ fontSize: `${fontSize}px`, lineHeight }}
          >
            <p className="line-clamp-3">
              {i18n.t("settings.readerEmbed.preview.content")}
            </p>
          </div>
          <div className="border-t px-3 py-1 text-[10px] flex items-center justify-between">
            <span>1 / 80</span>
            <span style={{ color: styleConfig.accent }}>{i18n.t("settings.readerEmbed.preview.nav")}</span>
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

  return (
    <ConfigCard
      title={i18n.t("settings.readerEmbed.title")}
      description={i18n.t("settings.readerEmbed.desc")}
    >
      <SettingItem
        icon={<Move className="size-4" />}
        title={i18n.t("settings.readerEmbed.position.title")}
        description={i18n.t("settings.readerEmbed.position.desc")}
      >
        <Tabs
          value={settings.position ?? DEFAULT_USER_SETTINGS.position}
          onValueChange={value => updateSettings({ position: value as typeof settings.position })}
          className="w-[260px]"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="top">{i18n.t("settings.readerEmbed.position.top")}</TabsTrigger>
            <TabsTrigger value="bottom">{i18n.t("settings.readerEmbed.position.bottom")}</TabsTrigger>
            <TabsTrigger value="floating">{i18n.t("settings.readerEmbed.position.floating")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </SettingItem>

      <SettingItem
        icon={<Palette className="size-4" />}
        title={i18n.t("settings.readerEmbed.colors.title")}
        description={i18n.t("settings.readerEmbed.colors.desc")}
      >
        <div className="grid grid-cols-2 gap-3">
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.colors.background")}
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={normalizeColor(resolvedStyle.background, DEFAULT_USER_SETTINGS.readerStyle.background)}
              onChange={e => updateReaderStyle({ background: e.target.value })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.colors.foreground")}
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={normalizeColor(resolvedStyle.foreground, DEFAULT_USER_SETTINGS.readerStyle.foreground)}
              onChange={e => updateReaderStyle({ foreground: e.target.value })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.colors.border")}
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={normalizeColor(resolvedStyle.border, DEFAULT_USER_SETTINGS.readerStyle.border)}
              onChange={e => updateReaderStyle({ border: e.target.value })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.colors.accent")}
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={normalizeColor(resolvedStyle.accent, DEFAULT_USER_SETTINGS.readerStyle.accent)}
              onChange={e => updateReaderStyle({ accent: e.target.value })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.colors.opacity")}
            <Input
              type="number"
              min="0.5"
              max="1"
              step="0.01"
              className="w-20 h-9"
              value={resolvedStyle.opacity}
              onChange={e => updateReaderStyle({ opacity: Number.parseFloat(e.target.value) || 0.98 })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.colors.radius")}
            <Input
              type="number"
              min="0"
              max="24"
              step="1"
              className="w-20 h-9"
              value={resolvedStyle.radius}
              onChange={e => updateReaderStyle({ radius: Number.parseInt(e.target.value, 10) || 0 })}
            />
          </Label>
        </div>
      </SettingItem>

      <SettingItem
        icon={<Ruler className="size-4" />}
        title={i18n.t("settings.readerEmbed.size.title")}
        description={i18n.t("settings.readerEmbed.size.desc")}
      >
        <div className="grid grid-cols-2 gap-3">
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.size.barHeight")}
            <Input
              type="number"
              min="48"
              max="240"
              step="4"
              className="w-20 h-9"
              value={resolvedStyle.barHeight}
              onChange={e => updateReaderStyle({ barHeight: Number.parseInt(e.target.value, 10) || 120 })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.size.floatingWidth")}
            <Input
              type="number"
              min="260"
              max="720"
              step="10"
              className="w-20 h-9"
              value={resolvedStyle.floatingWidth}
              onChange={e => updateReaderStyle({ floatingWidth: Number.parseInt(e.target.value, 10) || 360 })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.size.floatingHeight")}
            <Input
              type="number"
              min="120"
              max="520"
              step="10"
              className="w-20 h-9"
              value={resolvedStyle.floatingHeight}
              onChange={e => updateReaderStyle({ floatingHeight: Number.parseInt(e.target.value, 10) || 240 })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.size.fontSize")}
            <Input
              type="number"
              min="12"
              max="30"
              step="1"
              className="w-20 h-9"
              value={fontSize}
              onChange={e => updateSettings({ fontSize: Number.parseInt(e.target.value, 10) || 16 })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            {i18n.t("settings.readerEmbed.size.lineHeight")}
            <Input
              type="number"
              min="1"
              max="3"
              step="0.1"
              className="w-20 h-9"
              value={lineHeight}
              onChange={e => updateSettings({ lineHeight: Number.parseFloat(e.target.value) || 1.6 })}
            />
          </Label>
        </div>
      </SettingItem>

      <SettingItem
        icon={<BookOpenText className="size-4" />}
        title={i18n.t("settings.readerEmbed.preview.title")}
        description={i18n.t("settings.readerEmbed.preview.desc")}
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
