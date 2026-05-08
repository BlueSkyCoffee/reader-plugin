import { i18n } from "#imports"
import {
  AlertCircle,
  BookOpen,
  Download,
  ExternalLink,
  FileText,
  HelpCircle,
  Mail,
  ShieldCheck,
  Wrench,
} from "lucide-react"
import { PageLayout } from "@/components/layout/page-layout"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const SECTIONS = [
  {
    id: "overview",
    title: i18n.t("help_section_overview_title"),
    description: i18n.t("help_section_overview_desc"),
    icon: BookOpen,
    items: [
      {
        icon: BookOpen,
        titleKey: "help_section_overview_item1_title",
        descKey: "help_section_overview_item1_desc",
      },
      {
        icon: Download,
        titleKey: "help_section_overview_item2_title",
        descKey: "help_section_overview_item2_desc",
      },
      {
        icon: ShieldCheck,
        titleKey: "help_section_overview_item3_title",
        descKey: "help_section_overview_item3_desc",
      },
    ],
  },
  {
    id: "quickstart",
    title: i18n.t("help_section_quickstart_title"),
    description: i18n.t("help_section_quickstart_desc"),
    icon: Wrench,
    steps: [
      i18n.t("help_section_quickstart_step1"),
      i18n.t("help_section_quickstart_step2"),
      i18n.t("help_section_quickstart_step3"),
      i18n.t("help_section_quickstart_step4"),
    ],
  },
  {
    id: "rules",
    title: i18n.t("help_section_rules_title"),
    description: i18n.t("help_section_rules_desc"),
    icon: FileText,
    items: [
      {
        icon: FileText,
        titleKey: "help_section_rules_item1_title",
        descKey: "help_section_rules_item1_desc",
      },
      {
        icon: AlertCircle,
        titleKey: "help_section_rules_item2_title",
        descKey: "help_section_rules_item2_desc",
      },
      {
        icon: ShieldCheck,
        titleKey: "help_section_rules_item3_title",
        descKey: "help_section_rules_item3_desc",
      },
    ],
  },
  {
    id: "lightnovel",
    title: i18n.t("help_section_lightnovel_title"),
    description: i18n.t("help_section_lightnovel_desc"),
    icon: Download,
    items: [
      {
        icon: BookOpen,
        titleKey: "help_section_lightnovel_item1_title",
        descKey: "help_section_lightnovel_item1_desc",
      },
      {
        icon: Download,
        titleKey: "help_section_lightnovel_item2_title",
        descKey: "help_section_lightnovel_item2_desc",
      },
      {
        icon: ShieldCheck,
        titleKey: "help_section_lightnovel_item3_title",
        descKey: "help_section_lightnovel_item3_desc",
      },
    ],
  },
  {
    id: "troubleshoot",
    title: i18n.t("help_section_troubleshoot_title"),
    description: i18n.t("help_section_troubleshoot_desc"),
    icon: AlertCircle,
    items: [
      {
        icon: AlertCircle,
        titleKey: "help_section_troubleshoot_item1_title",
        descKey: "help_section_troubleshoot_item1_desc",
      },
      {
        icon: Wrench,
        titleKey: "help_section_troubleshoot_item2_title",
        descKey: "help_section_troubleshoot_item2_desc",
      },
      {
        icon: Download,
        titleKey: "help_section_troubleshoot_item3_title",
        descKey: "help_section_troubleshoot_item3_desc",
      },
    ],
  },
]

export function HelpPage() {
  return (
    <PageLayout title={i18n.t("help_title")} description={i18n.t("help_description")}>
      <div className="flex flex-col gap-6">
        {/* Quick Nav */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="size-5 text-primary" />
              {i18n.t("help_toc_title")}
            </CardTitle>
            <p className="text-sm text-muted-foreground">{i18n.t("help_toc_desc")}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 p-6 pt-0">
            {SECTIONS.map((section, index) => (
              <Button
                key={section.id}
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => document.getElementById(section.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              >
                <Badge variant="secondary" className="size-5 shrink-0 justify-center rounded-full p-0 text-[10px]">
                  {index + 1}
                </Badge>
                {section.title}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* FAQ Accordion */}
        <Card>
          <CardContent className="p-6">
            <Accordion type="multiple" className="w-full">
              {SECTIONS.map(section => (
                <AccordionItem key={section.id} value={section.id} id={section.id}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <section.icon className="size-5 shrink-0 text-primary" />
                      <div>
                        <p className="font-semibold">{section.title}</p>
                        <p className="text-xs text-muted-foreground font-normal">{section.description}</p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pl-8">
                      {section.steps && (
                        <ol className="grid gap-2 text-sm text-muted-foreground">
                          {section.steps.map((step, i) => (
                            <li key={step} className="flex items-start gap-3">
                              <Badge variant="secondary" className="mt-0.5 size-5 shrink-0 justify-center rounded-full p-0 text-[10px]">
                                {i + 1}
                              </Badge>
                              <span>{step}</span>
                            </li>
                          ))}
                        </ol>
                      )}

                      {section.items && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {section.items.map(item => (
                            <div
                              key={item.titleKey}
                              className="flex gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                            >
                              <item.icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">{i18n.t(item.titleKey)}</p>
                                <p className="text-xs text-muted-foreground">{i18n.t(item.descKey)}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader className="p-6 pb-4">
            <CardTitle className="text-base">{i18n.t("help_contact_title")}</CardTitle>
            <p className="text-sm text-muted-foreground">{i18n.t("help_contact_desc")}</p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 p-6 pt-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open("https://github.com", "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="size-4" data-icon="inline-start" />
              {i18n.t("popup_more_project")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open("mailto:support@example.com", "_blank")}
            >
              <Mail className="size-4" data-icon="inline-start" />
              {i18n.t("help_contact_email")}
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          {i18n.t("help_contact_hint")}
        </p>
      </div>
    </PageLayout>
  )
}
