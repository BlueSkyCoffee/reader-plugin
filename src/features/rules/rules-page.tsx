import type { ScraperRule } from "@/types/novel"
import { i18n } from "#imports"
import {
  AlertCircle,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { EmptyState } from "@/components/app/empty-state"
import { SearchInput } from "@/components/app/search-input"
import { StatCard, StatGrid } from "@/components/app/stat-card"
import { PageLayout } from "@/components/layout/page-layout"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { CreateRuleDialog } from "@/features/rules"
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
      toast.error(i18n.t("rules_error_loadFailed"))
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
    toast.success(i18n.t("rules_import_toast_success", [newRules.length]))
  }

  const handleDelete = async (id: string, name: string) => {
    if (!await confirmAction(i18n.t("rules_delete_confirm", [name])))
      return

    const newRules = rules.filter(r => r.id !== id)
    await StorageManager.saveRules(newRules)
    setRules(newRules)
    toast.success(i18n.t("rules_delete_success"))
  }

  const handleRuleCreate = async (newRule: ScraperRule) => {
    try {
      const mergedRules = [...rules]
      const existingIndex = mergedRules.findIndex(
        r => r.url === newRule.url || r.id === newRule.id,
      )

      if (existingIndex >= 0) {
        mergedRules[existingIndex] = newRule
        toast.success(i18n.t("rules_update_success"))
      }
      else {
        mergedRules.push(newRule)
        toast.success(i18n.t("rules_create_success"))
      }

      await StorageManager.saveRules(mergedRules)
      setRules(mergedRules)
    }
    catch (error) {
      log.rules.error("Create rule failed", error)
      toast.error(i18n.t("rules_create_error"))
    }
  }

  const handleToggleEnabled = async (id: string, name: string, enabled: boolean) => {
    const newRules = rules.map(r =>
      r.id === id ? { ...r, disabled: !enabled } : r,
    )
    await StorageManager.saveRules(newRules)
    setRules(newRules)
    toast.success(i18n.t(enabled ? "rules_toggle_enabled" : "rules_toggle_disabled", { name }))
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
    <PageLayout title={i18n.t("rules_title")}>
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <StatGrid className="grid-cols-1 md:grid-cols-3">
          <StatCard label={i18n.t("rules_stats_total")} value={rules.length} />
          <StatCard label={i18n.t("rules_stats_builtin")} value={defaultRulesCount} valueClassName="text-primary" />
          <StatCard label={i18n.t("rules_stats_custom")} value={customRulesCount} valueClassName="text-success" />
        </StatGrid>

        {/* Actions */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            className="w-full md:max-w-64 md:flex-1"
            inputClassName="h-10"
            placeholder={i18n.t("rules_search_placeholder")}
            value={searchTerm}
            onChange={setSearchTerm}
          />
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
                  <EmptyState
                    title={i18n.t("rules_empty_title")}
                    description={i18n.t("rules_empty_description")}
                  />
                )}
              </div>
            )}

        {/* Help */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{i18n.t("rules_hint_title")}</AlertTitle>
          <AlertDescription>
            {i18n.t("rules_hint_description", [defaultRulesCount])}
          </AlertDescription>
        </Alert>
      </div>
    </PageLayout>
  )
}
