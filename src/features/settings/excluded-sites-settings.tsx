import { browser } from "wxt/browser"
import type { UserSettings } from "@/types/config"
import { useAtom } from "jotai"
import { Ban, Globe, Plus, Trash2 } from "lucide-react"
import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { settingsAtom } from "@/state/store"

function isValidDomain(domain: string): boolean {
  const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
  return domainPattern.test(domain) && domain.length > 0 && domain.length <= 253
}

function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase()
  if (domain.startsWith("http://") || domain.startsWith("https://")) {
    try {
      const url = new URL(input)
      domain = url.hostname
    }
    catch {
      return domain
    }
  }
  return domain.replace(/^www\./, "")
}

export function ExcludedSitesSettings() {
  const [settings, setSettings] = useAtom(settingsAtom)
  const [inputValue, setInputValue] = React.useState("")
  const excludedSites = settings.excludedSites ?? []

  const handleAdd = () => {
    const domain = normalizeDomain(inputValue)
    if (!isValidDomain(domain)) {
      toast.error(browser.i18n.getMessage("settings_general_excludedSites_toast_invalid"))
      return
    }
    if (excludedSites.includes(domain)) {
      toast.error(browser.i18n.getMessage("settings_general_excludedSites_toast_duplicate"))
      return
    }
    setSettings((prev: UserSettings) => ({
      ...prev,
      excludedSites: [...(prev.excludedSites ?? []), domain],
    }))
    setInputValue("")
    toast.success(browser.i18n.getMessage("settings_general_excludedSites_toast_added"))
  }

  const handleRemove = (domain: string) => {
    setSettings((prev: UserSettings) => ({
      ...prev,
      excludedSites: (prev.excludedSites ?? []).filter((site: string) => site !== domain),
    }))
    toast.success(browser.i18n.getMessage("settings_general_excludedSites_toast_removed"))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={browser.i18n.getMessage("settings_general_excludedSites_addPlaceholder")}
          className="h-9"
        />
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-1"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
        >
          <Plus className="size-4" data-icon="inline-start" />
          {browser.i18n.getMessage("settings_general_excludedSites_addButton")}
        </Button>
      </div>

      {excludedSites.length === 0
        ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <Ban className="size-4" />
              {browser.i18n.getMessage("settings_general_excludedSites_empty")}
            </div>
          )
        : (
            <div className="flex flex-col gap-2">
              {excludedSites.map((domain: string) => (
                <Card key={domain} className="border-border/60">
                  <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                    <div className="size-6 rounded-md bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <Globe className="size-3" />
                    </div>
                    <span className="font-medium text-sm text-foreground truncate flex-1">
                      {domain}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 gap-1 h-7"
                      onClick={() => handleRemove(domain)}
                    >
                      <Trash2 className="size-3" data-icon="inline-start" />
                      {browser.i18n.getMessage("settings_general_excludedSites_removeButton")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
    </div>
  )
}
