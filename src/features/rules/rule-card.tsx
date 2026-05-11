import { browser } from "wxt/browser"
import type { ScraperRule } from "@/types/novel"
import { Check, ChevronDown, ChevronUp, Copy, ExternalLink, Globe, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"

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
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <Card className="border-border/60 py-2 hover:bg-muted/30 transition-colors">
        {/* 主行：名称、开关、展开箭头 */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          {/* 图标 */}
          <div className="size-6 sm:size-7 rounded-md sm:rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Globe className="size-3 sm:size-3.5" />
          </div>

          {/* 名称 + 备注 */}
          <div className="flex-1 min-w-0 overflow-hidden mr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-medium text-sm text-foreground truncate" title={rule.name}>
                {rule.name}
              </span>
              {isDefault && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {browser.i18n.getMessage("rules_card_builtin")}
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
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-6 flex-shrink-0"
            >
              {expanded
                ? <ChevronUp className="size-3.5 text-muted-foreground" />
                : <ChevronDown className="size-3.5 text-muted-foreground" />}
            </Button>
          </CollapsibleTrigger>
        </div>

        {/* 展开的详情区域 */}
        <CollapsibleContent className="overflow-hidden data-open:animate-in data-closed:animate-out data-open:fade-in-0 data-closed:fade-out-0 data-open:slide-in-from-top-1 data-closed:slide-out-to-top-1">
          <div className="bg-muted/20 px-3 py-3">
            <Separator className="mb-3" />
            <div className="flex flex-col gap-3">
              {/* 功能标签 */}
              <div className="flex gap-1.5 flex-wrap">
                {rule.search && (
                  <Badge variant="outline" className="text-[10px]">
                    {browser.i18n.getMessage("rules_card_search")}
                  </Badge>
                )}
                {rule.toc && (
                  <Badge variant="outline" className="text-[10px]">
                    {browser.i18n.getMessage("rules_card_toc")}
                  </Badge>
                )}
                {rule.chapter && (
                  <Badge variant="outline" className="text-[10px]">
                    {browser.i18n.getMessage("rules_card_content")}
                  </Badge>
                )}
              </div>

              {/* URL */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">URL:</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0 h-7 text-xs font-mono justify-start truncate"
                  onClick={() => onOpenUrl(rule.url)}
                  title={rule.url}
                >
                  {rule.url}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 shrink-0"
                  onClick={() => onOpenUrl(rule.url)}
                >
                  <ExternalLink className="size-3" />
                </Button>
              </div>

              {/* ID */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-10 shrink-0">ID:</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 min-w-0 h-7 text-xs font-mono justify-start gap-1 truncate"
                  onClick={() => onCopyId(rule.id)}
                  title={browser.i18n.getMessage("rules_card_copyId")}
                >
                  {copiedId === rule.id
                    ? (
                        <>
                          <Check className="size-3 text-primary shrink-0" />
                          <span className="text-primary">{browser.i18n.getMessage("rules_card_copied")}</span>
                        </>
                      )
                    : (
                        <>
                          <Copy className="size-3 shrink-0" />
                          <span className="truncate">{rule.id}</span>
                        </>
                      )}
                </Button>
              </div>

              {/* 搜索配置 */}
              {rule.search && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground">{browser.i18n.getMessage("rules_create_section_search")}</span>
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
                  <span className="text-xs font-medium text-muted-foreground">{browser.i18n.getMessage("rules_card_toc")}</span>
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
                  <span className="text-xs font-medium text-muted-foreground">{browser.i18n.getMessage("rules_card_content")}</span>
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
                      {browser.i18n.getMessage("rules_actions_delete")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
