import { browser } from "wxt/browser"
import type { ScraperRule } from "@/types/novel"
import { AlertCircle, Plus } from "lucide-react"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, FormSection } from "@/components/settings/form-section"

interface CreateRuleDialogProps {
  onRuleCreate: (rule: ScraperRule) => Promise<void> | void
  onRulesImport?: (rules: ScraperRule[]) => Promise<void> | void
}

interface RuleFormData {
  name: string
  url: string
  search: {
    url: string
    method: "get" | "post"
    result: string
    bookName: string
    author: string
    data?: string
    latestChapter?: string
    lastUpdateTime?: string
  }
  book: {
    bookName: string
    author: string
    intro: string
    category?: string
    coverUrl?: string
  }
  toc: {
    item: string
    url?: string
  }
  chapter: {
    title: string
    content: string
    filterTxt?: string
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error)
    return error.message
  if (typeof error === "string")
    return error
  return String(error)
}

function hasRequiredRuleFields(rule: unknown): boolean {
  if (typeof rule !== "object" || rule === null)
    return false
  const r = rule as Record<string, unknown>
  return typeof r.name === "string" && typeof r.url === "string"
}

export function CreateRuleDialog({ onRuleCreate, onRulesImport }: CreateRuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"form" | "json" | "import">("form")
  const [importContent, setImportContent] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    url: "",
    search: {
      url: "",
      method: "post",
      result: "",
      bookName: "",
      author: "",
    },
    book: {
      bookName: "",
      author: "",
      intro: "",
    },
    toc: {
      item: "",
    },
    chapter: {
      title: "",
      content: "",
    },
  })

  const [jsonContent, setJsonContent] = useState("")

  const handleFormChange = (path: string, value: string) => {
    setError(null)
    const keys = path.split(".")
    const newData = { ...formData } as Record<string, unknown>

    let current = newData
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key])
        current[key] = {}
      current = current[key] as Record<string, unknown>
    }
    current[keys[keys.length - 1]] = value

    setFormData(newData as unknown as RuleFormData)
  }

  const validateRule = (rule: unknown): string | null => {
    if (!hasRequiredRuleFields(rule))
      return browser.i18n.getMessage("rules_create_validation_nameRequired")

    const r = rule as Record<string, unknown>
    const search = r.search as Record<string, unknown> | undefined
    const book = r.book as Record<string, unknown> | undefined
    const toc = r.toc as Record<string, unknown> | undefined
    const chapter = r.chapter as Record<string, unknown> | undefined

    if (!r.name?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_nameRequired")
    if (!r.url?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_urlRequired")
    if (!search?.url?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_searchUrlRequired")
    if (!search?.result?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_searchResultRequired")
    if (!search?.bookName?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_searchBooknameRequired")
    if (!search?.author?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_searchAuthorRequired")
    if (!book?.bookName?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_bookNameRequired")
    if (!book?.author?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_bookAuthorRequired")
    if (!book?.intro?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_bookIntroRequired")
    if (!toc?.item?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_tocItemRequired")
    if (!chapter?.title?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_chapterTitleRequired")
    if (!chapter?.content?.toString().trim())
      return browser.i18n.getMessage("rules_create_validation_chapterContentRequired")
    return null
  }

  const handleFormSubmit = async () => {
    const validationError = validateRule(formData)
    if (validationError) {
      setError(validationError)
      return
    }

    const rule: ScraperRule = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      url: formData.url,
      search: {
        url: formData.search.url,
        method: formData.search.method,
        result: formData.search.result,
        bookName: formData.search.bookName,
        author: formData.search.author,
        data: formData.search.data,
        latestChapter: formData.search.latestChapter,
        lastUpdateTime: formData.search.lastUpdateTime,
      },
      book: {
        bookName: formData.book.bookName,
        author: formData.book.author,
        intro: formData.book.intro,
        category: formData.book.category,
        coverUrl: formData.book.coverUrl,
      },
      toc: {
        item: formData.toc.item,
        url: formData.toc.url,
      },
      chapter: {
        title: formData.chapter.title,
        content: formData.chapter.content,
        filterTxt: formData.chapter.filterTxt,
      },
    }

    await onRuleCreate(rule)
    resetForm()
    setOpen(false)
  }

  const handleImportSubmit = async () => {
    setError(null)
    if (!importContent.trim()) {
      setError(browser.i18n.getMessage("rules_import_toast_error"))
      return
    }

    try {
      const parsed: unknown = JSON.parse(importContent)
      let newRules: ScraperRule[] = []

      if (Array.isArray(parsed)) {
        newRules = parsed as ScraperRule[]
      }
      else if (typeof parsed === "object" && parsed !== null) {
        newRules = [parsed as ScraperRule]
      }
      else {
        throw new Error(browser.i18n.getMessage("rules_import_toast_invalidJson"))
      }

      const isValid = newRules.every(r => r.name && r.url && r.search && r.book && r.chapter)
      if (!isValid) {
        throw new Error(browser.i18n.getMessage("rules_import_toast_invalidFormat"))
      }

      newRules.forEach((rule) => {
        if (!rule.id) {
          rule.id = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
        }
      })

      if (onRulesImport) {
        await onRulesImport(newRules)
      }
      resetForm()
      setOpen(false)
    }
    catch (e: unknown) {
      setError(getErrorMessage(e) || browser.i18n.getMessage("rules_import_toast_parseFailed"))
    }
  }

  const handleJsonSubmit = async () => {
    setError(null)
    if (!jsonContent.trim()) {
      setError(browser.i18n.getMessage("rules_create_validation_jsonEmpty"))
      return
    }

    try {
      const parsed: unknown = JSON.parse(jsonContent)
      const rule = typeof parsed === "object" && parsed !== null ? parsed : null

      if (!rule) {
        throw new Error(browser.i18n.getMessage("rules_create_validation_invalidJson"))
      }

      const validationError = validateRule(rule)
      if (validationError) {
        setError(validationError)
        return
      }

      const typedRule = rule as ScraperRule
      if (!typedRule.id) {
        typedRule.id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }

      await onRuleCreate(typedRule)
      resetForm()
      setOpen(false)
    }
    catch (e: unknown) {
      setError(getErrorMessage(e) || browser.i18n.getMessage("rules_create_validation_jsonFailed"))
    }
  }

  function resetForm() {
    setFormData({
      name: "",
      url: "",
      search: {
        url: "",
        method: "post",
        result: "",
        bookName: "",
        author: "",
      },
      book: {
        bookName: "",
        author: "",
        intro: "",
      },
      toc: {
        item: "",
      },
      chapter: {
        title: "",
        content: "",
      },
    })
    setJsonContent("")
    setImportContent("")
    setError(null)
    setMode("form")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-10 shadow-sm px-6">
          <Plus className="size-4" data-icon="inline-start" />
          {browser.i18n.getMessage("rules_create_title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden bg-background text-foreground border-border sm:h-auto sm:max-h-[90vh] sm:max-w-[700px]">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle>{browser.i18n.getMessage("rules_create_dialogTitle")}</DialogTitle>
          <DialogDescription>{browser.i18n.getMessage("rules_create_description")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          <Tabs value={mode} onValueChange={v => setMode(v as "form" | "json" | "import")} className="flex h-full w-full min-h-0 flex-col">
            <div className="shrink-0 pb-4">
              <TabsList className="grid w-full grid-cols-3 bg-muted/70 border border-border">
                <TabsTrigger value="form" className="data-[state=active]:bg-background data-[state=active]:text-foreground">{browser.i18n.getMessage("rules_create_tabForm")}</TabsTrigger>
                <TabsTrigger value="json" className="data-[state=active]:bg-background data-[state=active]:text-foreground">{browser.i18n.getMessage("rules_create_tabJson")}</TabsTrigger>
                <TabsTrigger value="import" className="data-[state=active]:bg-background data-[state=active]:text-foreground">{browser.i18n.getMessage("rules_create_tabImport")}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="form" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
              <div className="flex flex-col gap-6 pb-4 pr-2">
                <FormSection title={browser.i18n.getMessage("rules_create_section_basic")}>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_name")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="name"
                        placeholder={browser.i18n.getMessage("rules_create_field_name_placeholder")}
                        value={formData.name || ""}
                        onChange={e => handleFormChange("name", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="url" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_url")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="url"
                        placeholder={browser.i18n.getMessage("rules_create_field_url_placeholder")}
                        value={formData.url || ""}
                        onChange={e => handleFormChange("url", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection title={browser.i18n.getMessage("rules_create_section_search")}>
                  <FieldGroup>
                    <div>
                      <Label htmlFor="search-url" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_searchUrl")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="search-url"
                        placeholder={browser.i18n.getMessage("rules_create_field_searchUrl_placeholder")}
                        value={formData.search?.url || ""}
                        onChange={e => handleFormChange("search.url", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="search-method" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_method")}
                        {" "}
                        *
                      </Label>
                      <Select
                        value={formData.search?.method || "post"}
                        onValueChange={value => handleFormChange("search.method", value)}
                      >
                        <SelectTrigger id="search-method" className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="get">GET</SelectItem>
                          <SelectItem value="post">POST</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="search-data" className="text-xs font-semibold text-muted-foreground">{browser.i18n.getMessage("rules_create_field_payload")}</Label>
                      <Input
                        id="search-data"
                        placeholder={browser.i18n.getMessage("rules_create_field_payload_placeholder")}
                        value={formData.search?.data || ""}
                        onChange={e => handleFormChange("search.data", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="search-result" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_searchResult")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="search-result"
                        placeholder={browser.i18n.getMessage("rules_create_field_searchResult_placeholder")}
                        value={formData.search?.result || ""}
                        onChange={e => handleFormChange("search.result", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="search-bookname" className="text-xs font-semibold text-muted-foreground">
                          {browser.i18n.getMessage("rules_create_field_searchBookname")}
                          {" "}
                          *
                        </Label>
                        <Input
                          id="search-bookname"
                          placeholder=".title > a"
                          value={formData.search?.bookName || ""}
                          onChange={e => handleFormChange("search.bookName", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="search-author" className="text-xs font-semibold text-muted-foreground">
                          {browser.i18n.getMessage("rules_create_field_searchAuthor")}
                          {" "}
                          *
                        </Label>
                        <Input
                          id="search-author"
                          placeholder=".author"
                          value={formData.search?.author || ""}
                          onChange={e => handleFormChange("search.author", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="search-latest" className="text-xs font-semibold text-muted-foreground">{browser.i18n.getMessage("rules_create_field_searchLatest")}</Label>
                        <Input
                          id="search-latest"
                          placeholder=".latest-chapter"
                          value={formData.search?.latestChapter || ""}
                          onChange={e => handleFormChange("search.latestChapter", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="search-update" className="text-xs font-semibold text-muted-foreground">{browser.i18n.getMessage("rules_create_field_searchUpdate")}</Label>
                        <Input
                          id="search-update"
                          placeholder=".update-time"
                          value={formData.search?.lastUpdateTime || ""}
                          onChange={e => handleFormChange("search.lastUpdateTime", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </FieldGroup>
                </FormSection>

                <FormSection title={browser.i18n.getMessage("rules_create_section_book")}>
                  <FieldGroup>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="book-name" className="text-xs font-semibold text-muted-foreground">
                          {browser.i18n.getMessage("rules_create_field_bookName")}
                          {" "}
                          *
                        </Label>
                        <Input
                          id="book-name"
                          placeholder="meta[property='og:novel:book_name']"
                          value={formData.book?.bookName || ""}
                          onChange={e => handleFormChange("book.bookName", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="book-author" className="text-xs font-semibold text-muted-foreground">
                          {browser.i18n.getMessage("rules_create_field_bookAuthor")}
                          {" "}
                          *
                        </Label>
                        <Input
                          id="book-author"
                          placeholder="meta[property='og:novel:author']"
                          value={formData.book?.author || ""}
                          onChange={e => handleFormChange("book.author", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="book-intro" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_bookIntro")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="book-intro"
                        placeholder="meta[property='og:description']"
                        value={formData.book?.intro || ""}
                        onChange={e => handleFormChange("book.intro", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="book-category" className="text-xs font-semibold text-muted-foreground">{browser.i18n.getMessage("rules_create_field_bookCategory")}</Label>
                        <Input
                          id="book-category"
                          placeholder="meta[property='og:novel:category']"
                          value={formData.book?.category || ""}
                          onChange={e => handleFormChange("book.category", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="book-cover" className="text-xs font-semibold text-muted-foreground">{browser.i18n.getMessage("rules_create_field_bookCover")}</Label>
                        <Input
                          id="book-cover"
                          placeholder="meta[property='og:image']"
                          value={formData.book?.coverUrl || ""}
                          onChange={e => handleFormChange("book.coverUrl", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </FieldGroup>
                </FormSection>

                <FormSection title={browser.i18n.getMessage("rules_create_section_toc")} className="border-b-0 pb-2">
                  <FieldGroup>
                    <div>
                      <Label htmlFor="toc-url" className="text-xs font-semibold text-muted-foreground">{browser.i18n.getMessage("rules_create_field_tocUrl")}</Label>
                      <Input
                        id="toc-url"
                        placeholder={browser.i18n.getMessage("rules_create_field_tocUrl_placeholder")}
                        value={formData.toc?.url || ""}
                        onChange={e => handleFormChange("toc.url", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toc-item" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_tocItem")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="toc-item"
                        placeholder="#list > dl > dd > a"
                        value={formData.toc?.item || ""}
                        onChange={e => handleFormChange("toc.item", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chapter-title" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_chapterTitle")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="chapter-title"
                        placeholder=".bookname h1"
                        value={formData.chapter?.title || ""}
                        onChange={e => handleFormChange("chapter.title", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chapter-content" className="text-xs font-semibold text-muted-foreground">
                        {browser.i18n.getMessage("rules_create_field_chapterContent")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="chapter-content"
                        placeholder="#content"
                        value={formData.chapter?.content || ""}
                        onChange={e => handleFormChange("chapter.content", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="chapter-filter" className="text-xs font-semibold text-muted-foreground">{browser.i18n.getMessage("rules_create_field_chapterFilter")}</Label>
                      <Textarea
                        id="chapter-filter"
                        placeholder={browser.i18n.getMessage("rules_create_field_chapterFilter_placeholder")}
                        value={formData.chapter?.filterTxt || ""}
                        onChange={e => handleFormChange("chapter.filterTxt", e.target.value)}
                        className="mt-1 h-20 bg-background"
                      />
                    </div>
                  </FieldGroup>
                </FormSection>
              </div>
            </TabsContent>

            <TabsContent value="json" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
              <div className="flex flex-col gap-4 pb-4 pr-2">
                <div className="grid gap-2">
                  <Label htmlFor="json-content" className="text-xs font-semibold text-muted-foreground">
                    {browser.i18n.getMessage("rules_create_jsonLabel")}
                  </Label>
                  <Textarea
                    id="json-content"
                    placeholder={browser.i18n.getMessage("rules_create_jsonPlaceholder")}
                    value={jsonContent}
                    onChange={e => setJsonContent(e.target.value)}
                    className="h-[400px] font-mono text-sm"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="import" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
              <div className="flex flex-col gap-4 pb-4 pr-2">
                <div className="grid gap-2">
                  <Label htmlFor="import-json" className="text-xs font-semibold text-muted-foreground">
                    {browser.i18n.getMessage("rules_import_label")}
                  </Label>
                  <Textarea
                    id="import-json"
                    placeholder={browser.i18n.getMessage("rules_import_placeholder")}
                    value={importContent}
                    onChange={e => setImportContent(e.target.value)}
                    className="h-[300px] font-mono text-xs"
                  />
                </div>
              </div>
            </TabsContent>
            {error && (
              <Alert variant="destructive" className="mt-4 shrink-0">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{browser.i18n.getMessage("rules_create_validationErrorTitle")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </Tabs>
        </div>

        <DialogFooter className="mt-4 shrink-0 border-t border-border pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {browser.i18n.getMessage("rules_create_cancel")}
          </Button>
          <Button onClick={() => void (mode === "form" ? handleFormSubmit() : mode === "json" ? handleJsonSubmit() : handleImportSubmit())} className="shadow-sm">
            {browser.i18n.getMessage("rules_create_submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
