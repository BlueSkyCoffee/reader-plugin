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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { FieldGroup, FormSection } from "@/features/rules/form-section"
import { i18n } from "@/i18n"

interface CreateRuleDialogProps {
  onRuleCreate: (rule: ScraperRule) => Promise<void> | void
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

export function CreateRuleDialog({ onRuleCreate }: CreateRuleDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"form" | "json">("form")
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
      return i18n.t("rules.create.validation.nameRequired")

    const r = rule as Record<string, unknown>
    const search = r.search as Record<string, unknown> | undefined
    const book = r.book as Record<string, unknown> | undefined
    const toc = r.toc as Record<string, unknown> | undefined
    const chapter = r.chapter as Record<string, unknown> | undefined

    if (!r.name?.toString().trim())
      return i18n.t("rules.create.validation.nameRequired")
    if (!r.url?.toString().trim())
      return i18n.t("rules.create.validation.urlRequired")
    if (!search?.url?.toString().trim())
      return i18n.t("rules.create.validation.searchUrlRequired")
    if (!search?.result?.toString().trim())
      return i18n.t("rules.create.validation.searchResultRequired")
    if (!search?.bookName?.toString().trim())
      return i18n.t("rules.create.validation.searchBooknameRequired")
    if (!search?.author?.toString().trim())
      return i18n.t("rules.create.validation.searchAuthorRequired")
    if (!book?.bookName?.toString().trim())
      return i18n.t("rules.create.validation.bookNameRequired")
    if (!book?.author?.toString().trim())
      return i18n.t("rules.create.validation.bookAuthorRequired")
    if (!book?.intro?.toString().trim())
      return i18n.t("rules.create.validation.bookIntroRequired")
    if (!toc?.item?.toString().trim())
      return i18n.t("rules.create.validation.tocItemRequired")
    if (!chapter?.title?.toString().trim())
      return i18n.t("rules.create.validation.chapterTitleRequired")
    if (!chapter?.content?.toString().trim())
      return i18n.t("rules.create.validation.chapterContentRequired")
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

  const handleJsonSubmit = async () => {
    setError(null)
    if (!jsonContent.trim()) {
      setError(i18n.t("rules.create.validation.jsonEmpty"))
      return
    }

    try {
      const parsed: unknown = JSON.parse(jsonContent)
      const rule = typeof parsed === "object" && parsed !== null ? parsed : null

      if (!rule) {
        throw new Error(i18n.t("rules.create.validation.invalidJson"))
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
      setError(getErrorMessage(e) || i18n.t("rules.create.validation.jsonFailed"))
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
    setError(null)
    setMode("form")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 h-10 shadow-sm px-6">
          <Plus className="size-4" data-icon="inline-start" />
          {i18n.t("rules.create.title")}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[90vh] max-h-[90vh] flex-col overflow-hidden bg-background text-foreground border-border sm:h-auto sm:max-h-[90vh] sm:max-w-[700px]">
        <DialogHeader className="shrink-0 pb-4">
          <DialogTitle>{i18n.t("rules.create.dialogTitle")}</DialogTitle>
          <DialogDescription>{i18n.t("rules.create.description")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          <Tabs value={mode} onValueChange={v => setMode(v as "form" | "json")} className="flex h-full w-full min-h-0 flex-col">
            <div className="shrink-0 pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-muted/70 border border-border">
                <TabsTrigger value="form" className="data-[state=active]:bg-background data-[state=active]:text-foreground">{i18n.t("rules.create.tabForm")}</TabsTrigger>
                <TabsTrigger value="json" className="data-[state=active]:bg-background data-[state=active]:text-foreground">{i18n.t("rules.create.tabJson")}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="form" className="mt-0 min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2">
              <div className="flex flex-col gap-6 pb-4 pr-2">
                <FormSection title={i18n.t("rules.create.section.basic")}>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="name" className="text-xs font-semibold text-muted-foreground">
                        {i18n.t("rules.create.field.name")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="name"
                        placeholder={i18n.t("rules.create.field.name.placeholder")}
                        value={formData.name || ""}
                        onChange={e => handleFormChange("name", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="url" className="text-xs font-semibold text-muted-foreground">
                        {i18n.t("rules.create.field.url")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="url"
                        placeholder={i18n.t("rules.create.field.url.placeholder")}
                        value={formData.url || ""}
                        onChange={e => handleFormChange("url", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </FormSection>

                <FormSection title={i18n.t("rules.create.section.search")}>
                  <FieldGroup>
                    <div>
                      <Label htmlFor="search-url" className="text-xs font-semibold text-muted-foreground">
                        {i18n.t("rules.create.field.searchUrl")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="search-url"
                        placeholder={i18n.t("rules.create.field.searchUrl.placeholder")}
                        value={formData.search?.url || ""}
                        onChange={e => handleFormChange("search.url", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="search-method" className="text-xs font-semibold text-muted-foreground">
                        {i18n.t("rules.create.field.method")}
                        {" "}
                        *
                      </Label>
                      <select
                        id="search-method"
                        value={formData.search?.method || "post"}
                        onChange={e => handleFormChange("search.method", e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
                      >
                        <option value="get">GET</option>
                        <option value="post">POST</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="search-data" className="text-xs font-semibold text-muted-foreground">{i18n.t("rules.create.field.payload")}</Label>
                      <Input
                        id="search-data"
                        placeholder={i18n.t("rules.create.field.payload.placeholder")}
                        value={formData.search?.data || ""}
                        onChange={e => handleFormChange("search.data", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="search-result" className="text-xs font-semibold text-muted-foreground">
                        {i18n.t("rules.create.field.searchResult")}
                        {" "}
                        *
                      </Label>
                      <Input
                        id="search-result"
                        placeholder={i18n.t("rules.create.field.searchResult.placeholder")}
                        value={formData.search?.result || ""}
                        onChange={e => handleFormChange("search.result", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="search-bookname" className="text-xs font-semibold text-muted-foreground">
                          {i18n.t("rules.create.field.searchBookname")}
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
                          {i18n.t("rules.create.field.searchAuthor")}
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
                        <Label htmlFor="search-latest" className="text-xs font-semibold text-muted-foreground">{i18n.t("rules.create.field.searchLatest")}</Label>
                        <Input
                          id="search-latest"
                          placeholder=".latest-chapter"
                          value={formData.search?.latestChapter || ""}
                          onChange={e => handleFormChange("search.latestChapter", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="search-update" className="text-xs font-semibold text-muted-foreground">{i18n.t("rules.create.field.searchUpdate")}</Label>
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

                <FormSection title={i18n.t("rules.create.section.book")}>
                  <FieldGroup>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="book-name" className="text-xs font-semibold text-muted-foreground">
                          {i18n.t("rules.create.field.bookName")}
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
                          {i18n.t("rules.create.field.bookAuthor")}
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
                        {i18n.t("rules.create.field.bookIntro")}
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
                        <Label htmlFor="book-category" className="text-xs font-semibold text-muted-foreground">{i18n.t("rules.create.field.bookCategory")}</Label>
                        <Input
                          id="book-category"
                          placeholder="meta[property='og:novel:category']"
                          value={formData.book?.category || ""}
                          onChange={e => handleFormChange("book.category", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="book-cover" className="text-xs font-semibold text-muted-foreground">{i18n.t("rules.create.field.bookCover")}</Label>
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

                <FormSection title={i18n.t("rules.create.section.toc")} className="border-b-0 pb-2">
                  <FieldGroup>
                    <div>
                      <Label htmlFor="toc-url" className="text-xs font-semibold text-muted-foreground">{i18n.t("rules.create.field.tocUrl")}</Label>
                      <Input
                        id="toc-url"
                        placeholder={i18n.t("rules.create.field.tocUrl.placeholder")}
                        value={formData.toc?.url || ""}
                        onChange={e => handleFormChange("toc.url", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="toc-item" className="text-xs font-semibold text-muted-foreground">
                        {i18n.t("rules.create.field.tocItem")}
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
                        {i18n.t("rules.create.field.chapterTitle")}
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
                        {i18n.t("rules.create.field.chapterContent")}
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
                      <Label htmlFor="chapter-filter" className="text-xs font-semibold text-muted-foreground">{i18n.t("rules.create.field.chapterFilter")}</Label>
                      <Textarea
                        id="chapter-filter"
                        placeholder={i18n.t("rules.create.field.chapterFilter.placeholder")}
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
                    {i18n.t("rules.create.jsonLabel")}
                  </Label>
                  <Textarea
                    id="json-content"
                    placeholder={i18n.t("rules.create.jsonPlaceholder")}
                    value={jsonContent}
                    onChange={e => setJsonContent(e.target.value)}
                    className="h-[400px] font-mono text-sm"
                  />
                </div>
              </div>
            </TabsContent>
            {error && (
              <Alert variant="destructive" className="mt-4 shrink-0">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{i18n.t("rules.create.validationErrorTitle")}</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </Tabs>
        </div>

        <DialogFooter className="mt-4 shrink-0 border-t border-border pt-4">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {i18n.t("rules.create.cancel")}
          </Button>
          <Button onClick={() => void (mode === "form" ? handleFormSubmit() : handleJsonSubmit())} className="shadow-sm">
            {i18n.t("rules.create.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
