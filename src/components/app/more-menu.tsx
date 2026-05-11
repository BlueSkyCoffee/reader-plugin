import { Icon } from "@iconify/react"
import { Ban } from "lucide-react"
import { useEffect, useState } from "react"
import { browser } from "wxt/browser"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StorageManager } from "@/lib/storage"
import { log } from "@/utils/logger"

function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname
  }
  catch {
    return null
  }
}

export function MoreMenu() {
  const [currentDomain, setCurrentDomain] = useState<string | null>(null)
  const [isExcluded, setIsExcluded] = useState(false)
  const [isHttpPage, setIsHttpPage] = useState(false)

  useEffect(() => {
    const checkCurrentTab = async () => {
      try {
        const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
        if (tab?.url) {
          const url = tab.url
          setIsHttpPage(url.startsWith("http://") || url.startsWith("https://"))
          const domain = extractDomain(url)
          setCurrentDomain(domain)

          if (domain) {
            const settings = await StorageManager.getSettings()
            setIsExcluded(settings.excludedSites?.includes(domain) ?? false)
          }
        }
      }
      catch (error) {
        log.popup.error("Get current tab failed", error)
      }
    }

    void checkCurrentTab()
  }, [])

  const handleExcludeToggle = async () => {
    if (!currentDomain)
      return

    try {
      const settings = await StorageManager.getSettings()
      const currentExcluded = settings.excludedSites ?? []

      if (isExcluded) {
        const newExcluded = currentExcluded.filter(site => site !== currentDomain)
        await StorageManager.saveSettings({ excludedSites: newExcluded })
        setIsExcluded(false)
      }
      else {
        const newExcluded = [...currentExcluded, currentDomain]
        await StorageManager.saveSettings({ excludedSites: newExcluded })
        setIsExcluded(true)
      }
    }
    catch (error) {
      log.popup.error("Toggle exclusion failed", error)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs"
        >
          <Icon icon="tabler:dots" className="size-4" strokeWidth={1.6} />
          {browser.i18n.getMessage("popup_more_title")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-fit">
        {isHttpPage && currentDomain && (
          <>
            <DropdownMenuItem
              onClick={handleExcludeToggle}
              className={`cursor-pointer ${isExcluded ? "text-orange-500 focus:text-orange-500" : ""}`}
            >
              <Ban className="size-4" />
              {isExcluded ? browser.i18n.getMessage("popup_more_cancelExclude") : browser.i18n.getMessage("popup_more_excludeSite")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onClick={() => browser.runtime.openOptionsPage()}
          className="cursor-pointer"
        >
          <Icon icon="tabler:help-circle" className="size-4" />
          {browser.i18n.getMessage("popup_more_help")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.open("https://github.com", "_blank", "noopener,noreferrer")}
          className="cursor-pointer"
        >
          <Icon icon="fa7-brands:github" className="size-4" />
          {browser.i18n.getMessage("popup_more_project")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.open("mailto:support@example.com", "_blank")}
          className="cursor-pointer"
        >
          <Icon icon="tabler:mail" className="size-4" />
          {browser.i18n.getMessage("popup_more_feedback")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
