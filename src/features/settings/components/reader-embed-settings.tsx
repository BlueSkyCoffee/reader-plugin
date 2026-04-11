import { useAtom } from "jotai"
import { BookOpenText, Move, Palette, Ruler } from "lucide-react"
import * as React from "react"
import { ConfigCard } from "@/shared/components/settings/config-card"
import { SettingItem } from "@/shared/components/settings/setting-item"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { settingsAtom } from "@/shared/state/store"
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
      <div className="text-xs text-muted-foreground mb-2">阅读区域预览</div>
      <div className="relative flex justify-center">
        <div className="border shadow-sm flex flex-col" style={previewStyle}>
          {isFloating && (
            <div className="flex items-center justify-between border-b px-3 py-1 text-[10px] uppercase tracking-wide">
              <span className="opacity-70">拖动区</span>
              <span className="opacity-50">浮动模式</span>
            </div>
          )}
          <div
            className="flex-1 min-h-0 overflow-hidden px-3 py-2 font-mono"
            style={{ fontSize: `${fontSize}px`, lineHeight }}
          >
            <p className="line-clamp-3">
              这里会显示正在阅读的章节内容。你可以调整背景、字体、透明度以及尺寸。
            </p>
          </div>
          <div className="border-t px-3 py-1 text-[10px] flex items-center justify-between">
            <span>1 / 80</span>
            <span style={{ color: styleConfig.accent }}>上一章 · 下一章</span>
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
      title="嵌入式阅读区域"
      description="在当前网页内嵌阅读面板，支持固定或浮动显示"
    >
      <SettingItem
        icon={<Move className="w-4 h-4" />}
        title="显示位置"
        description="可固定在页面顶部、底部，或使用可拖动的浮动面板"
      >
        <Tabs
          value={settings.position ?? DEFAULT_USER_SETTINGS.position}
          onValueChange={value => updateSettings({ position: value as typeof settings.position })}
          className="w-[260px]"
        >
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="top">顶部</TabsTrigger>
            <TabsTrigger value="bottom">底部</TabsTrigger>
            <TabsTrigger value="floating">浮动</TabsTrigger>
          </TabsList>
        </Tabs>
      </SettingItem>

      <SettingItem
        icon={<Palette className="w-4 h-4" />}
        title="颜色与透明度"
        description="自定义阅读区域的背景、文字、边框和强调色"
      >
        <div className="grid grid-cols-2 gap-3">
          <Label className="flex items-center justify-between gap-3">
            背景
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={normalizeColor(resolvedStyle.background, DEFAULT_USER_SETTINGS.readerStyle.background)}
              onChange={e => updateReaderStyle({ background: e.target.value })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            文字
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={normalizeColor(resolvedStyle.foreground, DEFAULT_USER_SETTINGS.readerStyle.foreground)}
              onChange={e => updateReaderStyle({ foreground: e.target.value })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            边框
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={normalizeColor(resolvedStyle.border, DEFAULT_USER_SETTINGS.readerStyle.border)}
              onChange={e => updateReaderStyle({ border: e.target.value })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            强调
            <Input
              type="color"
              className="h-9 w-14 p-1"
              value={normalizeColor(resolvedStyle.accent, DEFAULT_USER_SETTINGS.readerStyle.accent)}
              onChange={e => updateReaderStyle({ accent: e.target.value })}
            />
          </Label>
          <Label className="flex items-center justify-between gap-3">
            透明度
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
            圆角
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
        icon={<Ruler className="w-4 h-4" />}
        title="尺寸与排版"
        description="调整阅读区域的高度与字体排版"
      >
        <div className="grid grid-cols-2 gap-3">
          <Label className="flex items-center justify-between gap-3">
            条形高度
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
            浮动宽度
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
            浮动高度
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
            字号
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
            行高
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
        icon={<BookOpenText className="w-4 h-4" />}
        title="效果预览"
        description="实时查看嵌入式阅读区域的样式效果"
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
