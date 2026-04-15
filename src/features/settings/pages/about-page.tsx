import { BookOpen, Globe, Info, Mail, ShieldCheck } from "lucide-react"
import { browser } from "wxt/browser"
import { PageLayout } from "@/shared/components/layout/page-layout"
import { ConfigCard } from "@/shared/components/settings/config-card"
import { SettingItem } from "@/shared/components/settings/setting-item"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { i18n } from "@/shared/i18n"

const MANIFEST_VERSION = browser?.runtime?.getManifest?.().version ?? "dev"

export function AboutPage() {
  return (
    <PageLayout title={i18n.t("settings.about")} description={i18n.t("about.description")}>
      <div className="space-y-0 divide-y">
        <ConfigCard title={i18n.t("about.app.title")} description={i18n.t("about.app.desc")}>
          <div className="grid gap-3 md:grid-cols-2">
            <SettingItem icon={<ShieldCheck className="w-4 h-4" />} title={i18n.t("about.app.version")}>
              <Badge variant="secondary">{MANIFEST_VERSION}</Badge>
            </SettingItem>
            <SettingItem icon={<Globe className="w-4 h-4" />} title={i18n.t("about.app.runtime")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.app.runtimeValue")}</span>
            </SettingItem>
            <SettingItem icon={<BookOpen className="w-4 h-4" />} title={i18n.t("about.app.core")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.app.coreValue")}</span>
            </SettingItem>
            <SettingItem icon={<Info className="w-4 h-4" />} title={i18n.t("about.app.mode")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.app.modeValue")}</span>
            </SettingItem>
          </div>
        </ConfigCard>

        <ConfigCard title={i18n.t("about.scope.title")} description={i18n.t("about.scope.desc")}>
          <div className="grid gap-3">
            <SettingItem title={i18n.t("about.scope.rules.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.scope.rules.desc")}</span>
            </SettingItem>
            <SettingItem title={i18n.t("about.scope.download.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.scope.download.desc")}</span>
            </SettingItem>
            <SettingItem title={i18n.t("about.scope.lightnovel.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.scope.lightnovel.desc")}</span>
            </SettingItem>
          </div>
        </ConfigCard>

        <ConfigCard title={i18n.t("about.privacy.title")} description={i18n.t("about.privacy.desc")}>
          <div className="grid gap-3">
            <SettingItem title={i18n.t("about.privacy.local.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.privacy.local.desc")}</span>
            </SettingItem>
            <SettingItem title={i18n.t("about.privacy.network.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.privacy.network.desc")}</span>
            </SettingItem>
            <SettingItem title={i18n.t("about.privacy.permissions.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.privacy.permissions.desc")}</span>
            </SettingItem>
          </div>
        </ConfigCard>

        <ConfigCard title={i18n.t("about.guidelines.title")} description={i18n.t("about.guidelines.desc")}>
          <div className="grid gap-3">
            <SettingItem title={i18n.t("about.guidelines.rate.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.guidelines.rate.desc")}</span>
            </SettingItem>
            <SettingItem title={i18n.t("about.guidelines.rules.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.guidelines.rules.desc")}</span>
            </SettingItem>
            <SettingItem title={i18n.t("about.guidelines.feedback.title")}>
              <span className="text-sm text-muted-foreground">{i18n.t("about.guidelines.feedback.desc")}</span>
            </SettingItem>
          </div>
        </ConfigCard>

        <ConfigCard title={i18n.t("about.support.title")} description={i18n.t("about.support.desc")}>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("mailto:support@example.com", "_blank")}
            >
              <Mail className="w-4 h-4 mr-2" />
              {i18n.t("about.support.contact")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {i18n.t("about.support.hint")}
          </p>
        </ConfigCard>
      </div>
    </PageLayout>
  )
}
