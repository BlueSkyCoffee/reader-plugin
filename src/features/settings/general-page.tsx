import { browser } from "wxt/browser"
import { useAtom } from "jotai"
import { Moon, Sun, Zap } from "lucide-react"
import { PageLayout } from "@/components/app/page-layout"
import { useTheme } from "@/components/providers/theme-provider"
import { ConfigCard } from "@/components/settings/config-card"
import { SettingItem } from "@/components/settings/setting-item"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReaderEmbedSettings } from "@/features/reader/embed-settings"
import { ExcludedSitesSettings } from "@/features/settings/excluded-sites-settings"
import { ShortcutsSettings } from "@/features/settings/shortcuts-settings"
import { settingsAtom } from "@/state/store"
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
    <PageLayout title={browser.i18n.getMessage("settings_general")} description={browser.i18n.getMessage("settings_general_description")}>
      <div className="flex flex-col divide-y">
        <ConfigCard
          title={browser.i18n.getMessage("settings_general_appearance_title")}
          description={browser.i18n.getMessage("settings_general_appearance_desc")}
        >
          <SettingItem
            icon={<Sun className="size-4" />}
            title={browser.i18n.getMessage("settings_general_theme_title")}
            description={browser.i18n.getMessage("settings_general_theme_desc")}
          >
            <Tabs
              value={theme}
              onValueChange={handleThemeChange}
              className="w-[260px]"
            >
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="light" className="gap-1">
                  <Sun className="size-3.5" />
                  {browser.i18n.getMessage("settings_general_theme_light")}
                </TabsTrigger>
                <TabsTrigger value="dark" className="gap-1">
                  <Moon className="size-3.5" />
                  {browser.i18n.getMessage("settings_general_theme_dark")}
                </TabsTrigger>
                <TabsTrigger value="system" className="gap-1">
                  <Zap className="size-3.5" />
                  {browser.i18n.getMessage("settings_general_theme_system")}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </SettingItem>
        </ConfigCard>

        <ReaderEmbedSettings />

        <ConfigCard
          title={browser.i18n.getMessage("settings_general_rules_title")}
          description={browser.i18n.getMessage("settings_general_rules_desc")}
        >
          <SettingItem
            title={browser.i18n.getMessage("settings_general_rules_autoUpdate_title")}
            description={browser.i18n.getMessage("settings_general_rules_autoUpdate_desc")}
          >
            <Switch
              checked={autoUpdateRules}
              onCheckedChange={(checked) => {
                setSettings(prev => ({ ...prev, autoUpdateRules: checked }))
              }}
              aria-label={browser.i18n.getMessage("settings_general_rules_autoUpdate_aria")}
            />
          </SettingItem>
        </ConfigCard>

        <ConfigCard
          title={browser.i18n.getMessage("settings_general_download_title")}
          description={browser.i18n.getMessage("settings_general_download_desc")}
        >
          <SettingItem
            title={browser.i18n.getMessage("settings_general_download_concurrent_title")}
            description={browser.i18n.getMessage("settings_general_download_concurrent_desc")}
          >
            <div className="flex flex-col gap-1.5 w-[200px]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {concurrentDownloads}
                  {" "}
                  {browser.i18n.getMessage("settings_general_download_concurrent_unit")}
                </span>
              </div>
              <Slider
                min={1}
                max={10}
                step={1}
                value={[concurrentDownloads]}
                onValueChange={([v]) => setSettings(prev => ({ ...prev, concurrentDownloads: v }))}
              />
            </div>
          </SettingItem>
        </ConfigCard>

        <ConfigCard
          title={browser.i18n.getMessage("settings_general_shortcuts_title")}
          description={browser.i18n.getMessage("settings_general_shortcuts_desc")}
        >
          <ShortcutsSettings />
        </ConfigCard>

        <ConfigCard
          title={browser.i18n.getMessage("settings_general_excludedSites_title")}
          description={browser.i18n.getMessage("settings_general_excludedSites_desc")}
        >
          <ExcludedSitesSettings />
        </ConfigCard>
      </div>
    </PageLayout>
  )
}
