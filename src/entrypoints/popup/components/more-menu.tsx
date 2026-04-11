import { Icon } from "@iconify/react"
import { browser } from "wxt/browser"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { i18n } from "@/shared/i18n"

export function MoreMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
        >
          <Icon icon="tabler:dots" className="size-4" strokeWidth={1.6} />
          <span className="text-[13px] font-medium">{i18n.t("popup.more.title")}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-fit">
        <DropdownMenuItem
          onClick={() => browser.runtime.openOptionsPage()}
          className="cursor-pointer"
        >
          <Icon icon="tabler:help-circle" className="size-4" />
          {i18n.t("popup.more.help")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.open("https://github.com", "_blank", "noopener,noreferrer")}
          className="cursor-pointer"
        >
          <Icon icon="fa7-brands:github" className="size-4" />
          {i18n.t("popup.more.project")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => window.open("mailto:support@example.com", "_blank")}
          className="cursor-pointer"
        >
          <Icon icon="tabler:mail" className="size-4" />
          {i18n.t("popup.more.feedback")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
