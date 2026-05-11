import type { ScraperRule } from "@/types/novel"

import {
  AlertCircle,
  Search,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { browser } from "wxt/browser"
import { PageLayout } from "@/components/app/page-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateRuleDialog } from "@/features/rules/create-rule-dialog"
import { RuleCard } from "@/features/rules/rule-card"
import { isDefaultRule } from "@/features/scraper/services/default-rules"
import { StorageManager } from "@/lib/storage"
import { confirmAction } from "@/utils/browser-dialog"
import { log } from "@/utils/logger"

export function RulesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [rules, setRules] = useState<ScraperRule[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadRules = async () => {
    try {
      setLoading(true)
      const storedRules = await StorageManager.getRules()
      setRules(storedRules)
    }
    catch (error) {
      log.rules.error("Load rules failed", error)
      toast.error(browser.i18n.getMessage("rules_error_loadFailed"))
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRules()
  }, [])

  const handleImport = async (newRules: ScraperRule[]) => {
    const mergedRules = [...rules]
    newRules.forEach((newRule) => {
      const existingIndex = mergedRules.findIndex(
        r => r.url === newRule.url || (r.id && r.id === newRule.id),
      )
      if (existingIndex >= 0) {
        mergedRules[existingIndex] = { ...newRule, id: mergedRules[existingIndex].id }
      }
      else {
        mergedRules.push(newRule)
      }
    })

    await StorageManager.saveRules(mergedRules)
    setRules(mergedRules)
    toast.success(browser.i18n.getMessage("rules_import_toast_success", [String(newRules.length)]))
  }

  const handleDelete = async (id: string, name: string) => {
    if (!await confirmAction(browser.i18n.getMessage("rules_delete_confirm", [name])))
      return

    const newRules = rules.filter(r => r.id !== id)
    await StorageManager.saveRules(newRules)
    setRules(newRules)
    toast.success(browser.i18n.getMessage("rules_delete_success"))
  }

  const handleRuleCreate = async (newRule: ScraperRule) => {
    try {
      const mergedRules = [...rules]
      const existingIndex = mergedRules.findIndex(
        r => r.url === newRule.url || r.id === newRule.id,
      )

      if (existingIndex >= 0) {
        mergedRules[existingIndex] = newRule
        toast.success(browser.i18n.getMessage("rules_update_success"))
      }
      else {
        mergedRules.push(newRule)
        toast.success(browser.i18n.getMessage("rules_create_success"))
      }

      await StorageManager.saveRules(mergedRules)
      setRules(mergedRules)
    }
    catch (error) {
      log.rules.error("Create rule failed", error)
      toast.error(browser.i18n.getMessage("rules_create_error"))
    }
  }

  const handleToggleEnabled = async (id: string, name: string, enabled: boolean) => {
    const newRules = rules.map(r =>
      r.id === id ? { ...r, disabled: !enabled } : r,
    )
    await StorageManager.saveRules(newRules)
    setRules(newRules)
    toast.success(browser.i18n.getMessage(enabled ? "rules_toggle_enabled" : "rules_toggle_disabled", [name]))
  }

  const handleCopyId = (id: string) => {
    void navigator.clipboard.writeText(id)
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredRules = rules.filter(
    rule =>
      rule.name.toLowerCase().includes(searchTerm.toLowerCase())
      || rule.url.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const defaultRulesCount = rules.filter(r => isDefaultRule(r.id)).length
  const customRulesCount = rules.length - defaultRulesCount

  return (
    <PageLayout title={browser.i18n.getMessage("rules_title")} description={browser.i18n.getMessage("rules_description")}>
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{browser.i18n.getMessage("rules_stats_total")}</p>
              <p className="mt-1 text-2xl font-bold">{rules.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{browser.i18n.getMessage("rules_stats_builtin")}</p>
              <p className="mt-1 text-2xl font-bold text-primary">{defaultRulesCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{browser.i18n.getMessage("rules_stats_custom")}</p>
              <p className="mt-1 text-2xl font-bold text-success">{customRulesCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <InputGroup className="w-full md:flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder={browser.i18n.getMessage("rules_search_placeholder")}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <CreateRuleDialog onRuleCreate={handleRuleCreate} onRulesImport={handleImport} />
        </div>

        {/* Rules list */}
        {loading
          ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            )
          : (
              <div className="flex flex-col gap-2">
                {filteredRules.map(rule => (
                  <RuleCard
                    key={rule.id}
                    rule={rule}
                    isDefault={isDefaultRule(rule.id)}
                    copiedId={copiedId}
                    onCopyId={handleCopyId}
                    onOpenUrl={url => window.open(url, "_blank")}
                    onDelete={handleDelete}
                    onToggleEnabled={handleToggleEnabled}
                  />
                ))}

                {filteredRules.length === 0 && (
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <AlertCircle />
                      </EmptyMedia>
                      <EmptyTitle>{browser.i18n.getMessage("rules_empty_title")}</EmptyTitle>
                      <EmptyDescription>{browser.i18n.getMessage("rules_empty_description")}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </div>
            )}

        {/* Help */}
        <Alert>
          <AlertCircle />
          <AlertTitle>{browser.i18n.getMessage("rules_hint_title")}</AlertTitle>
          <AlertDescription>
            {browser.i18n.getMessage("rules_hint_description", [String(defaultRulesCount)])}
          </AlertDescription>
        </Alert>
      </div>
    </PageLayout>
  )
}
