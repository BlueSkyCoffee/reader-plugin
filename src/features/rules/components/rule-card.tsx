import type { ScraperRule } from "@/types/novel"
import { Check, Copy, ExternalLink, Globe, Trash2 } from "lucide-react"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { i18n } from "@/shared/i18n"

interface RuleCardProps {
  rule: ScraperRule
  isDefault: boolean
  copiedId: string | null
  onCopyId: (id: string) => void
  onOpenUrl: (url: string) => void
  onDelete: (id: string, name: string) => void
}

export function RuleCard({
  rule,
  isDefault,
  copiedId,
  onCopyId,
  onOpenUrl,
  onDelete,
}: RuleCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/40 p-4 flex flex-col gap-3 shadow-sm hover:shadow-lg transition-all group hover:border-primary/60">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary flex-shrink-0 ring-1 ring-primary/20">
            <Globe className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="font-semibold text-[13px] text-foreground line-clamp-1"
                title={rule.name}
              >
                {rule.name}
              </div>
              {isDefault && (
                <Badge
                  variant="secondary"
                  className="text-[10px] shrink-0 bg-[oklch(0.9788_0.1212_108.45_/_0.9)] text-black border border-black/10"
                >
                  {i18n.t("rules.card.builtin")}
                </Badge>
              )}
            </div>
            <button
              type="button"
              className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-muted/70 px-2 py-0.5 text-[12px] text-foreground/80 hover:text-primary hover:bg-muted transition-colors truncate"
              onClick={() => onOpenUrl(rule.url)}
              title={rule.url}
            >
              {rule.url}
            </button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-primary"
          onClick={() => onOpenUrl(rule.url)}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {rule.search && (
          <Badge variant="secondary" className="text-[10px] bg-primary/10 text-slate-950 border border-primary/20">
            {i18n.t("rules.card.search")}
          </Badge>
        )}
        {rule.toc && (
          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-slate-950 border border-emerald-500/20">
            {i18n.t("rules.card.toc")}
          </Badge>
        )}
        {rule.chapter && (
          <Badge variant="secondary" className="text-[10px] bg-amber-500/10 text-slate-950 border border-amber-500/20">
            {i18n.t("rules.card.content")}
          </Badge>
        )}
      </div>

      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
        <button
          className="font-mono hover:text-primary transition-colors flex items-center gap-1"
          onClick={() => onCopyId(rule.id)}
          title={i18n.t("rules.card.copyId")}
        >
          {copiedId === rule.id
            ? (
                <>
                  <Check className="w-3 h-3" />
                  {i18n.t("rules.card.copied")}
                </>
              )
            : (
                <>
                  <Copy className="w-3 h-3" />
                  {rule.id.slice(0, 8)}
                </>
              )}
        </button>
        {!isDefault && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(rule.id, rule.name)}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
