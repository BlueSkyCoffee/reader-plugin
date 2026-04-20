import { useAtom } from "jotai"
import { Moon, Sun, Zap } from "lucide-react"
import { ReaderEmbedSettings } from "@/features/settings/components/reader-embed-settings"
import { ShortcutsSettings } from "@/features/settings/components/shortcuts-settings"
import { PageLayout } from "@/shared/components/layout/page-layout"
import { useTheme } from "@/shared/components/providers/theme-provider"
import { ConfigCard } from "@/shared/components/settings/config-card"
import { SettingItem } from "@/shared/components/settings/setting-item"
import { Input } from "@/shared/components/ui/input"
import { Switch } from "@/shared/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { i18n } from "@/shared/i18n"
import { settingsAtom } from "@/shared/state/store"
import { DEFAULT_USER_SETTINGS } from "@/types/config"

export function GeneralPage() {
  const { theme, setTheme } = useTheme()
  const [settings, setSettings] = useAtom(settingsAtom)

  const handleThemeChange = (value: string) => {
    if (value === "light" || value === "dark" || value === "system") {
      setTheme(value)
    }
  }

  const concurrentDownloads = settings.concurrentDownloads ?? DEFAULT_USER_SETTINGS.concurrentDownloads
  const autoUpdateRules = settings.autoUpdateRules ?? DEFAULT_USER_SETTINGS.autoUpdateRules

  return (
    <PageLayout title={i18n.t("settings.general")}>
      <div className="space-y-0 divide-y">
        <ConfigCard
          title={i18n.t("settings.general.appearance.title")}
          description={i18n.t("settings.general.appearance.desc")}
        >
          <SettingItem
            icon={<Sun className="w-4 h-4" />}
            title={i18n.t("settings.general.theme.title")}
            description={i18n.t("settings.general.theme.desc")}
          >
            <Tabs
              value={theme}
              onValueChange={handleThemeChange}
              className="w-[260px]"
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="light" className="gap-1">
                  <Sun className="w-3.5 h-3.5" />
                  {i18n.t("settings.general.theme.light")}
                </TabsTrigger>
                <TabsTrigger value="dark" className="gap-1">
                  <Moon className="w-3.5 h-3.5" />
                  {i18n.t("settings.general.theme.dark")}
                </TabsTrigger>
                <TabsTrigger value="system" className="gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  {i18n.t("settings.general.theme.system")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </SettingItem>
        </ConfigCard>

        <ReaderEmbedSettings />

        <ConfigCard
          title={i18n.t("settings.general.rules.title")}
          description={i18n.t("settings.general.rules.desc")}
        >
          <SettingItem
            title={i18n.t("settings.general.rules.autoUpdate.title")}
            description={i18n.t("settings.general.rules.autoUpdate.desc")}
          >
            <Switch
              checked={autoUpdateRules}
              onCheckedChange={(checked) => {
                setSettings(prev => ({ ...prev, autoUpdateRules: checked }))
              }}
              aria-label={i18n.t("settings.general.rules.autoUpdate.aria")}
            />
          </SettingItem>
        </ConfigCard>

        <ConfigCard
          title={i18n.t("settings.general.download.title")}
          description={i18n.t("settings.general.download.desc")}
        >
          <SettingItem
            title={i18n.t("settings.general.download.concurrent.title")}
            description={i18n.t("settings.general.download.concurrent.desc")}
          >
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                max="10"
                value={concurrentDownloads}
                onChange={(e) => {
                  const value = Math.min(10, Math.max(1, Number.parseInt(e.target.value, 10) || 1))
                  setSettings(prev => ({ ...prev, concurrentDownloads: value }))
                }}
                className="w-16 h-9"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {i18n.t("settings.general.download.concurrent.unit")}
              </span>
            </div>
          </SettingItem>
        </ConfigCard>

        <ConfigCard
          title={i18n.t("settings.general.shortcuts.title")}
          description={i18n.t("settings.general.shortcuts.desc")}
        >
          <ShortcutsSettings />
        </ConfigCard>
      </div>
    </PageLayout>
  )
}
