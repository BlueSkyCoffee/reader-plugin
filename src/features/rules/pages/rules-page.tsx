import type { ScraperRule } from "@/types/novel"
import {
  AlertCircle,
  Upload,
} from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { CreateRuleDialog } from "@/features/rules"
import { RuleCard } from "@/features/rules/components/rule-card"
import { isDefaultRule } from "@/features/scraper/services/default-rules"
import { EmptyState } from "@/shared/components/app/empty-state"
import { SearchInput } from "@/shared/components/app/search-input"
import { StatCard, StatGrid } from "@/shared/components/app/stat-card"
import { PageLayout } from "@/shared/components/layout/page-layout"
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert"
import { Button } from "@/shared/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { i18n } from "@/shared/i18n"
import { StorageManager } from "@/shared/infra/storage"
import { confirmAction } from "@/shared/utils/browser-dialog"

export function RulesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [rules, setRules] = useState<ScraperRule[]>([])
  const [loading, setLoading] = useState(true)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importContent, setImportContent] = useState("")
  const [importError, setImportError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const loadRules = async () => {
    try {
      setLoading(true)
      const storedRules = await StorageManager.getRules()
      setRules(storedRules)
    }
    catch (error) {
      console.error("Failed to load rules:", error)
      toast.error(i18n.t("rules.error.loadFailed"))
    }
    finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadRules()
  }, [])

  const handleImport = async () => {
    setImportError(null)
    if (!importContent.trim()) {
      setImportError(i18n.t("rules.import.toast.error"))
      return
    }

    try {
      let newRules: ScraperRule[] = []
      const parsed = JSON.parse(importContent)

      if (Array.isArray(parsed)) {
        newRules = parsed
      }
      else if (typeof parsed === "object" && parsed !== null) {
        newRules = [parsed as ScraperRule]
      }
      else {
        throw new Error(i18n.t("rules.import.toast.invalidJson"))
      }

      const isValid = newRules.every(
        r => r.name && r.url && r.search && r.book && r.chapter,
      )
      if (!isValid) {
        throw new Error(i18n.t("rules.import.toast.invalidFormat"))
      }

      const mergedRules = [...rules]
      newRules.forEach((newRule) => {
        if (!newRule.id) {
          newRule.id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }

        const existingIndex = mergedRules.findIndex(
          r => r.url === newRule.url || (r.id && r.id === newRule.id),
        )
        if (existingIndex >= 0) {
          mergedRules[existingIndex] = {
            ...newRule,
            id: mergedRules[existingIndex].id,
          }
        }
        else {
          mergedRules.push(newRule)
        }
      })

      await StorageManager.saveRules(mergedRules)
      setRules(mergedRules)
      setIsImportOpen(false)
      setImportContent("")
      toast.success(i18n.t("rules.import.toast.success", { count: newRules.length }))
    }
    catch (e: any) {
      setImportError(e.message || i18n.t("rules.import.toast.parseFailed"))
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!await confirmAction(i18n.t("rules.delete.confirm", { name })))
      return

    const newRules = rules.filter(r => r.id !== id)
    await StorageManager.saveRules(newRules)
    setRules(newRules)
    toast.success(i18n.t("rules.delete.success"))
  }

  const handleRuleCreate = async (newRule: ScraperRule) => {
    try {
      const mergedRules = [...rules]
      const existingIndex = mergedRules.findIndex(
        r => r.url === newRule.url || r.id === newRule.id,
      )

      if (existingIndex >= 0) {
        mergedRules[existingIndex] = newRule
        toast.success(i18n.t("rules.update.success"))
      }
      else {
        mergedRules.push(newRule)
        toast.success(i18n.t("rules.create.success"))
      }

      await StorageManager.saveRules(mergedRules)
      setRules(mergedRules)
    }
    catch (error) {
      console.error("Failed to create rule:", error)
      toast.error(i18n.t("rules.create.error"))
    }
  }

  const handleToggleEnabled = async (id: string, name: string, enabled: boolean) => {
    const newRules = rules.map(r =>
      r.id === id ? { ...r, disabled: !enabled } : r,
    )
    await StorageManager.saveRules(newRules)
    setRules(newRules)
    toast.success(i18n.t(enabled ? "rules.toggle.enabled" : "rules.toggle.disabled", { name }))
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
    <PageLayout title={i18n.t("rules.title")}>
      <div className="space-y-6">
        {/* 统计信息 */}
        <StatGrid className="grid-cols-1 md:grid-cols-3">
          <StatCard label={i18n.t("rules.stats.total")} value={rules.length} />
          <StatCard label={i18n.t("rules.stats.builtin")} value={defaultRulesCount} valueClassName="text-blue-600" />
          <StatCard label={i18n.t("rules.stats.custom")} value={customRulesCount} valueClassName="text-emerald-600" />
        </StatGrid>

        {/* 操作栏 */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <SearchInput
            className="w-full md:max-w-64 md:flex-1"
            inputClassName="h-10"
            placeholder={i18n.t("rules.search.placeholder")}
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <div className="flex w-full flex-wrap gap-2 md:w-auto md:justify-end">
            <CreateRuleDialog onRuleCreate={handleRuleCreate} />

            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="w-4 h-4" />
                  {i18n.t("rules.actions.import")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>{i18n.t("rules.import.dialogTitle")}</DialogTitle>
                  <DialogDescription>
                    {i18n.t("rules.import.description")}
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="json" className="text-xs font-semibold">
                      {i18n.t("rules.import.label")}
                    </Label>
                    <Textarea
                      id="json"
                      placeholder={i18n.t("rules.import.placeholder")}
                      className="h-[250px] font-mono text-xs"
                      value={importContent}
                      onChange={e => setImportContent(e.target.value)}
                    />
                  </div>
                  {importError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>{i18n.t("rules.import.errorTitle")}</AlertTitle>
                      <AlertDescription>{importError}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="ghost"
                    onClick={() => setIsImportOpen(false)}
                  >
                    {i18n.t("rules.import.cancel")}
                  </Button>
                  <Button onClick={handleImport}>{i18n.t("rules.import.submit")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 书源列表 */}
        <div className="space-y-2">
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

          {filteredRules.length === 0 && !loading && (
            <EmptyState
              title={i18n.t("rules.empty.title")}
              description={i18n.t("rules.empty.description")}
            />
          )}
        </div>

        {/* 帮助提示 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{i18n.t("rules.hint.title")}</AlertTitle>
          <AlertDescription>
            {i18n.t("rules.hint.description", { count: defaultRulesCount })}
          </AlertDescription>
        </Alert>
      </div>
    </PageLayout>
  )
}
