import { AlertCircle, BookOpen, Download, FileText, HelpCircle, ShieldCheck, Wrench } from "lucide-react"
import { PageLayout } from "@/shared/components/layout/page-layout"
import { ConfigCard } from "@/shared/components/settings/config-card"
import { SettingItem } from "@/shared/components/settings/setting-item"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { i18n } from "@/shared/i18n"

const SECTIONS = [
  {
    id: "overview",
    title: i18n.t("help.section.overview.title"),
    description: i18n.t("help.section.overview.desc"),
    items: [
      {
        icon: <BookOpen className="w-4 h-4" />,
        title: i18n.t("help.section.overview.item1.title"),
        desc: i18n.t("help.section.overview.item1.desc"),
      },
      {
        icon: <Download className="w-4 h-4" />,
        title: i18n.t("help.section.overview.item2.title"),
        desc: i18n.t("help.section.overview.item2.desc"),
      },
      {
        icon: <ShieldCheck className="w-4 h-4" />,
        title: i18n.t("help.section.overview.item3.title"),
        desc: i18n.t("help.section.overview.item3.desc"),
      },
    ],
  },
  {
    id: "quickstart",
    title: i18n.t("help.section.quickstart.title"),
    description: i18n.t("help.section.quickstart.desc"),
    steps: [
      i18n.t("help.section.quickstart.step1"),
      i18n.t("help.section.quickstart.step2"),
      i18n.t("help.section.quickstart.step3"),
      i18n.t("help.section.quickstart.step4"),
    ],
  },
  {
    id: "rules",
    title: i18n.t("help.section.rules.title"),
    description: i18n.t("help.section.rules.desc"),
    items: [
      {
        icon: <FileText className="w-4 h-4" />,
        title: i18n.t("help.section.rules.item1.title"),
        desc: i18n.t("help.section.rules.item1.desc"),
      },
      {
        icon: <AlertCircle className="w-4 h-4" />,
        title: i18n.t("help.section.rules.item2.title"),
        desc: i18n.t("help.section.rules.item2.desc"),
      },
      {
        icon: <ShieldCheck className="w-4 h-4" />,
        title: i18n.t("help.section.rules.item3.title"),
        desc: i18n.t("help.section.rules.item3.desc"),
      },
    ],
  },
  {
    id: "lightnovel",
    title: i18n.t("help.section.lightnovel.title"),
    description: i18n.t("help.section.lightnovel.desc"),
    items: [
      {
        icon: <BookOpen className="w-4 h-4" />,
        title: i18n.t("help.section.lightnovel.item1.title"),
        desc: i18n.t("help.section.lightnovel.item1.desc"),
      },
      {
        icon: <Download className="w-4 h-4" />,
        title: i18n.t("help.section.lightnovel.item2.title"),
        desc: i18n.t("help.section.lightnovel.item2.desc"),
      },
      {
        icon: <ShieldCheck className="w-4 h-4" />,
        title: i18n.t("help.section.lightnovel.item3.title"),
        desc: i18n.t("help.section.lightnovel.item3.desc"),
      },
    ],
  },
  {
    id: "troubleshoot",
    title: i18n.t("help.section.troubleshoot.title"),
    description: i18n.t("help.section.troubleshoot.desc"),
    items: [
      {
        icon: <AlertCircle className="w-4 h-4" />,
        title: i18n.t("help.section.troubleshoot.item1.title"),
        desc: i18n.t("help.section.troubleshoot.item1.desc"),
      },
      {
        icon: <Wrench className="w-4 h-4" />,
        title: i18n.t("help.section.troubleshoot.item2.title"),
        desc: i18n.t("help.section.troubleshoot.item2.desc"),
      },
      {
        icon: <Download className="w-4 h-4" />,
        title: i18n.t("help.section.troubleshoot.item3.title"),
        desc: i18n.t("help.section.troubleshoot.item3.desc"),
      },
    ],
  },
]

export function HelpPage() {
  return (
    <PageLayout title={i18n.t("help.title")} description={i18n.t("help.description")}>
      <div className="space-y-6">
        <ConfigCard title={i18n.t("help.toc.title")} description={i18n.t("help.toc.desc")}>
          <div className="flex flex-wrap gap-2">
            {SECTIONS.map(section => (
              <Button
                key={section.id}
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <HelpCircle className="w-4 h-4" />
                {section.title}
              </Button>
            ))}
          </div>
        </ConfigCard>

        <article className="space-y-6">
          {SECTIONS.map((section, index) => (
            <section key={section.id} id={section.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <h2 className="text-base font-semibold">{section.title}</h2>
                  <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                </div>
              </div>

              {section.steps && (
                <ol className="grid gap-2 text-sm text-muted-foreground list-decimal ml-4">
                  {section.steps.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}

              {section.items && (
                <div className="grid gap-3 md:grid-cols-2">
                  {section.items.map(item => (
                    <ConfigCard key={item.title} title={item.title}>
                      <SettingItem icon={item.icon} title={item.title}>
                        <span className="text-sm text-muted-foreground">{item.desc}</span>
                      </SettingItem>
                    </ConfigCard>
                  ))}
                </div>
              )}

              {index < SECTIONS.length - 1 && <Separator />}
            </section>
          ))}
        </article>

        <ConfigCard title={i18n.t("help.contact.title")} description={i18n.t("help.contact.desc")}>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{i18n.t("help.contact.badge")}</Badge>
            <span className="text-xs text-muted-foreground">
              {i18n.t("help.contact.hint")}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("mailto:support@example.com", "_blank")}
            >
              {i18n.t("help.contact.email")}
            </Button>
          </div>
        </ConfigCard>
      </div>
    </PageLayout>
  )
}
