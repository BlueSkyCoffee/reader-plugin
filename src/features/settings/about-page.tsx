import { i18n } from "#imports"
import {
  BookOpen,
  Download,
  ExternalLink,
  Globe,
  Info,
  Mail,
  Palette,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { browser } from "wxt/browser"
import { PageLayout } from "@/components/layout/page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const MANIFEST_VERSION = browser?.runtime?.getManifest?.().version ?? "dev"

const FEATURES = [
  { icon: Globe, titleKey: "about_scope_rules_title", descKey: "about_scope_rules_desc" },
  { icon: Download, titleKey: "about_scope_download_title", descKey: "about_scope_download_desc" },
  { icon: BookOpen, titleKey: "about_scope_lightnovel_title", descKey: "about_scope_lightnovel_desc" },
  { icon: Palette, titleKey: "about_app_mode", descKey: "about_app_modeValue" },
  { icon: ShieldCheck, titleKey: "about_privacy_local_title", descKey: "about_privacy_local_desc" },
  { icon: Zap, titleKey: "about_app_core", descKey: "about_app_coreValue" },
]

const TECH_STACK = [
  "React 19",
  "Tailwind CSS v4",
  "shadcn/ui",
  "Jotai",
  "TanStack Query",
  "Dexie",
  "WXT",
]

export function AboutPage() {
  return (
    <PageLayout title={i18n.t("settings_about")} description={i18n.t("about_description")}>
      <div className="flex flex-col gap-6">
        {/* Hero */}
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
            <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="size-10 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-bold">Reader</h2>
                <Badge variant="secondary">
                  v
                  {MANIFEST_VERSION}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {i18n.t("about_app_desc")}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline">
                  {i18n.t("about_app_runtime")}
                  :
                  {" "}
                  {i18n.t("about_app_runtimeValue")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base">{i18n.t("about_scope_title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{i18n.t("about_scope_desc")}</p>
          </CardHeader>
          <CardContent className="grid gap-4 p-6 pt-0 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(feature => (
              <div
                key={feature.titleKey}
                className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <feature.icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{i18n.t(feature.titleKey)}</p>
                  <p className="text-xs text-muted-foreground">{i18n.t(feature.descKey)}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tech Stack */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base">{i18n.t("about_app_title")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 p-6 pt-0">
            {TECH_STACK.map(tech => (
              <Badge key={tech} variant="secondary">{tech}</Badge>
            ))}
          </CardContent>
        </Card>

        {/* Privacy */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base">{i18n.t("about_privacy_title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{i18n.t("about_privacy_desc")}</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid gap-3">
              <div className="flex gap-3 rounded-lg border p-3">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{i18n.t("about_privacy_local_title")}</p>
                  <p className="text-xs text-muted-foreground">{i18n.t("about_privacy_local_desc")}</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border p-3">
                <Globe className="mt-0.5 size-5 shrink-0 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{i18n.t("about_privacy_network_title")}</p>
                  <p className="text-xs text-muted-foreground">{i18n.t("about_privacy_network_desc")}</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border p-3">
                <Info className="mt-0.5 size-5 shrink-0 text-orange-600" />
                <div>
                  <p className="text-sm font-medium">{i18n.t("about_privacy_permissions_title")}</p>
                  <p className="text-xs text-muted-foreground">{i18n.t("about_privacy_permissions_desc")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guidelines */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base">{i18n.t("about_guidelines_title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{i18n.t("about_guidelines_desc")}</p>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid gap-3">
              <div className="flex gap-3 rounded-lg border p-3">
                <Zap className="mt-0.5 size-5 shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">{i18n.t("about_guidelines_rate_title")}</p>
                  <p className="text-xs text-muted-foreground">{i18n.t("about_guidelines_rate_desc")}</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border p-3">
                <BookOpen className="mt-0.5 size-5 shrink-0 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">{i18n.t("about_guidelines_rules_title")}</p>
                  <p className="text-xs text-muted-foreground">{i18n.t("about_guidelines_rules_desc")}</p>
                </div>
              </div>
              <div className="flex gap-3 rounded-lg border p-3">
                <Mail className="mt-0.5 size-5 shrink-0 text-cyan-600" />
                <div>
                  <p className="text-sm font-medium">{i18n.t("about_guidelines_feedback_title")}</p>
                  <p className="text-xs text-muted-foreground">{i18n.t("about_guidelines_feedback_desc")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base">{i18n.t("about_support_title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{i18n.t("about_support_desc")}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 p-6 pt-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open("mailto:support@example.com", "_blank")}
            >
              <Mail className="size-4" data-icon="inline-start" />
              {i18n.t("about_support_contact")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open("https://github.com", "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-4" data-icon="inline-start" />
              GitHub
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {i18n.t("about_support_hint")}
        </p>
      </div>
    </PageLayout>
  )
}
