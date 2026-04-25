import type { ScraperRule } from "@/types/novel"
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, Globe, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { i18n } from "@/i18n"

interface RuleCardProps {
  rule: ScraperRule
  isDefault: boolean
  copiedId: string | null
  onCopyId: (id: string) => void
  onOpenUrl: (url: string) => void
  onDelete: (id: string, name: string) => void
  onToggleEnabled: (id: string, name: string, enabled: boolean) => void
}

export function RuleCard({
  rule,
  isDefault,
  copiedId,
  onCopyId,
  onOpenUrl,
  onDelete,
  onToggleEnabled,
}: RuleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isEnabled = !rule.disabled

  return (
    <Card className="border-border/60">
      {/* 主行：名称、开关、展开箭头 */}
      <div className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors">
        {/* 图标 */}
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
          <Globe className="size-3 sm:size-3.5" />
        </div>

        {/* 名称 + 备注 */}
        <div className="flex-1 min-w-0 overflow-hidden mr-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium text-sm text-foreground truncate" title={rule.name}>
              {rule.name}
            </span>
            {isDefault && (
              <Badge variant="builtin" className="text-[10px] shrink-0">
                {i18n.t("rules.card.builtin")}
              </Badge>
            )}
          </div>
          {rule.comment && (
            <span className="text-xs text-muted-foreground truncate block mt-0.5" title={rule.comment}>
              {rule.comment}
            </span>
          )}
        </div>

        {/* 启用开关 */}
        <Switch
          checked={isEnabled}
          onCheckedChange={checked => onToggleEnabled(rule.id, rule.name, checked)}
          className="flex-shrink-0"
        />

        {/* 展开箭头 */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 flex-shrink-0"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded
            ? <ChevronUp className="size-3.5 text-muted-foreground" />
            : <ChevronDown className="size-3.5 text-muted-foreground" />}
        </Button>
      </div>

      {/* 展开的详情区域 */}
      {expanded && (
        <div className="bg-muted/20 px-3 py-3">
          <Separator className="mb-3" />
          <div className="flex flex-col gap-3">
            {/* 功能标签 */}
            <div className="flex gap-1.5 flex-wrap">
              {rule.search && (
                <Badge variant="search" className="text-[10px]">
                  {i18n.t("rules.card.search")}
                </Badge>
              )}
              {rule.toc && (
                <Badge variant="toc" className="text-[10px]">
                  {i18n.t("rules.card.toc")}
                </Badge>
              )}
              {rule.chapter && (
                <Badge variant="content" className="text-[10px]">
                  {i18n.t("rules.card.content")}
                </Badge>
              )}
            </div>

            {/* URL */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 shrink-0">URL:</span>
              <button
                type="button"
                className="flex-1 min-w-0 text-xs text-foreground/80 hover:text-primary truncate font-mono bg-muted/50 px-2 py-1 rounded text-left"
                onClick={() => onOpenUrl(rule.url)}
                title={rule.url}
              >
                {rule.url}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 shrink-0"
                onClick={() => onOpenUrl(rule.url)}
              >
                <ExternalLink className="size-3" />
              </Button>
            </div>

            {/* ID */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10 shrink-0">ID:</span>
              <button
                type="button"
                className="flex-1 min-w-0 text-xs font-mono text-foreground/80 hover:text-primary truncate bg-muted/50 px-2 py-1 rounded flex items-center gap-1"
                onClick={() => onCopyId(rule.id)}
                title={i18n.t("rules.card.copyId")}
              >
                {copiedId === rule.id
                  ? (
                      <>
                        <Check className="size-3 text-primary shrink-0" />
                        <span className="text-primary">{i18n.t("rules.card.copied")}</span>
                      </>
                    )
                  : (
                      <>
                        <Copy className="size-3 shrink-0" />
                        <span className="truncate">{rule.id}</span>
                      </>
                    )}
              </button>
            </div>

            {/* 搜索配置 */}
            {rule.search && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{i18n.t("rules.create.section.search")}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-xs">
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-muted-foreground shrink-0">URL:</span>
                    <span className="font-mono truncate">{rule.search.url}</span>
                  </div>
                  <div className="flex items-center gap-1 min-w-0">
                    <span className="text-muted-foreground shrink-0">Method:</span>
                    <span className="font-mono">{rule.search.method}</span>
                  </div>
                  {rule.search.result && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">Result:</span>
                      <span className="font-mono truncate">{rule.search.result}</span>
                    </div>
                  )}
                  {rule.search.bookName && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">BookName:</span>
                      <span className="font-mono truncate">{rule.search.bookName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 目录配置 */}
            {rule.toc && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{i18n.t("rules.card.toc")}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-xs">
                  {rule.toc.item && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">Item:</span>
                      <span className="font-mono truncate">{rule.toc.item}</span>
                    </div>
                  )}
                  {rule.toc.list && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">List:</span>
                      <span className="font-mono truncate">{rule.toc.list}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 章节配置 */}
            {rule.chapter && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">{i18n.t("rules.card.content")}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-xs">
                  {rule.chapter.content && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">Content:</span>
                      <span className="font-mono truncate">{rule.chapter.content}</span>
                    </div>
                  )}
                  {rule.chapter.title && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">Title:</span>
                      <span className="font-mono truncate">{rule.chapter.title}</span>
                    </div>
                  )}
                  {rule.chapter.filterTxt && (
                    <div className="flex items-center gap-1 min-w-0 sm:col-span-2">
                      <span className="text-muted-foreground shrink-0">Filter:</span>
                      <span className="font-mono truncate">{rule.chapter.filterTxt}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 其他配置 */}
            {(rule.language || rule.needProxy || rule.crawl) && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-muted-foreground">其他配置</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 text-xs">
                  {rule.language && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">Language:</span>
                      <span>{rule.language}</span>
                    </div>
                  )}
                  {rule.needProxy && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">NeedProxy:</span>
                      <Badge variant="secondary">true</Badge>
                    </div>
                  )}
                  {rule.crawl?.concurrency && (
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-muted-foreground shrink-0">Concurrency:</span>
                      <span>{rule.crawl.concurrency}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 删除按钮（仅自定义规则） */}
            {!isDefault && (
              <div className="pt-2">
                <Separator className="mb-2" />
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive/60 hover:text-destructive hover:bg-destructive/10 gap-1 h-7"
                    onClick={() => onDelete(rule.id, rule.name)}
                  >
                    <Trash2 className="size-3" />
                    {i18n.t("rules.actions.delete")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
