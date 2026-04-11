import { BookOpen, Globe, Info, Mail, ShieldCheck } from "lucide-react"
import { browser } from "wxt/browser"
import { PageLayout } from "@/shared/components/layout/page-layout"
import { ConfigCard } from "@/shared/components/settings/config-card"
import { SettingItem } from "@/shared/components/settings/setting-item"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

const MANIFEST_VERSION = browser?.runtime?.getManifest?.().version ?? "dev"

export function AboutPage() {
  return (
    <PageLayout title="关于" description="版本信息、功能概览与使用规范">
      <div className="space-y-0 divide-y">
        <ConfigCard title="应用信息" description="当前插件版本与运行环境">
          <div className="grid gap-3 md:grid-cols-2">
            <SettingItem icon={<ShieldCheck className="w-4 h-4" />} title="版本">
              <Badge variant="secondary">{MANIFEST_VERSION}</Badge>
            </SettingItem>
            <SettingItem icon={<Globe className="w-4 h-4" />} title="运行环境">
              <span className="text-sm text-muted-foreground">Browser Extension</span>
            </SettingItem>
            <SettingItem icon={<BookOpen className="w-4 h-4" />} title="核心能力">
              <span className="text-sm text-muted-foreground">书源管理、全网搜索、下载导出、轻小说打包</span>
            </SettingItem>
            <SettingItem icon={<Info className="w-4 h-4" />} title="运行模式">
              <span className="text-sm text-muted-foreground">本地解析与本地存储，按需访问网络</span>
            </SettingItem>
          </div>
        </ConfigCard>

        <ConfigCard title="功能范围" description="主要能力与边界说明">
          <div className="grid gap-3">
            <SettingItem title="书源规则">
              <span className="text-sm text-muted-foreground">
                支持导入/导出/启用/禁用书源，规则用于指定搜索、目录与章节抓取方式。
              </span>
            </SettingItem>
            <SettingItem title="下载与导出">
              <span className="text-sm text-muted-foreground">
                支持章节缓存、批量导出 EPUB，并提供下载记录与历史统计。
              </span>
            </SettingItem>
            <SettingItem title="轻小说打包">
              <span className="text-sm text-muted-foreground">
                支持轻小说站点目录解析、分卷选择、合并打包与章节标题注入。
              </span>
            </SettingItem>
          </div>
        </ConfigCard>

        <ConfigCard title="数据与隐私" description="数据范围与安全说明">
          <div className="grid gap-3">
            <SettingItem title="本地存储">
              <span className="text-sm text-muted-foreground">
                书籍缓存、下载记录、书源配置等数据保存在浏览器本地存储中。
              </span>
            </SettingItem>
            <SettingItem title="网络访问">
              <span className="text-sm text-muted-foreground">
                仅在搜索、抓取与下载时访问目标站点，不主动上传本地数据。
              </span>
            </SettingItem>
            <SettingItem title="权限使用">
              <span className="text-sm text-muted-foreground">
                权限仅用于实现扩展核心功能（页面访问、存储、下载），不用于追踪或广告。
              </span>
            </SettingItem>
          </div>
        </ConfigCard>

        <ConfigCard title="使用规范" description="稳定性与合规建议">
          <div className="grid gap-3">
            <SettingItem title="合理频率">
              <span className="text-sm text-muted-foreground">
                访问频率过高可能触发站点限制，建议使用默认并发与间隔。
              </span>
            </SettingItem>
            <SettingItem title="规则来源">
              <span className="text-sm text-muted-foreground">
                导入第三方规则前请确认来源可靠，避免引入错误规则或异常抓取。
              </span>
            </SettingItem>
            <SettingItem title="问题反馈">
              <span className="text-sm text-muted-foreground">
                如遇抓取失败或规则失效，建议记录失败链接与提示信息以便排查。
              </span>
            </SettingItem>
          </div>
        </ConfigCard>

        <ConfigCard title="帮助与反馈" description="获取帮助或提交问题">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open("mailto:support@example.com", "_blank")}
            >
              <Mail className="w-4 h-4 mr-2" />
              联系支持
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            如需更快定位问题，请附带具体页面、书源规则 ID 与时间范围。
          </p>
        </ConfigCard>
      </div>
    </PageLayout>
  )
}
