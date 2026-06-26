"use client"

import { useState, useEffect, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { AlertTriangle, ArrowLeft, Eye, EyeOff, Save, Send, Copy, Archive, Trash2, Download, BookOpen, Tag } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MoreMenu } from "@/components/ui/more-menu"
import { SemanticBadge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ArticleEditor } from "@/components/editor/article-editor"
import { ArticlePreview } from "@/components/editor/article-preview"
import { useAutosave, type SaveStatus } from "@/components/editor/use-autosave"
import { type Block, type ArticleDocument, serializeDocument, deserializeDocument, createBlock, blocksToHtml } from "@/components/editor/types"

type ArticleData = { title: string; category: string; excerpt: string; content: string }
type WikiArticle = ArticleData & { author?: string; readTime?: string; id?: string }

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md transition-all",
      status === "saving" && "text-muted-foreground bg-muted/30",
      status === "saved" && "text-success bg-success/10",
      status === "error" && "text-destructive bg-destructive/10",
    )}>
      <span className={cn(
        "size-1.5 rounded-full",
        status === "saving" && "bg-muted-foreground animate-pulse",
        status === "saved" && "bg-success",
        status === "error" && "bg-destructive",
      )} />
      {status === "saving" ? "Saving..." : status === "saved" ? "Saved" : "Error saving"}
    </span>
  )
}

export default function EditWikiArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("Getting Started")
  const [excerpt, setExcerpt] = useState("")
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([createBlock("paragraph")])
  const [article, setArticle] = useState<WikiArticle | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [initialized, setInitialized] = useState(false)

  function getContentJson() {
    const doc: ArticleDocument = { title, coverImage: coverImage || undefined, blocks }
    return serializeDocument(doc)
  }

  const saveArticle = useCallback(async (data: ArticleData) => {
    const res = await fetch(`/api/knowledge/wiki/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error("Failed to save")
    const updated = await res.json()
    setArticle(updated)
    return updated
  }, [id])

  const { status, schedule, saveNow } = useAutosave<ArticleData>(saveArticle)

  useEffect(() => {
    fetch(`/api/knowledge/wiki/${id}`)
      .then(r => r.json())
      .then(json => {
        if (!json?.success) { toast.error(json?.error || "Article not found"); router.push("/knowledge/wiki"); return }
        const d = json.data
        setArticle(d)
        setTitle(d.title || "")
        setCategory(d.category || "Getting Started")
        setExcerpt(d.excerpt || "")
        if (d.content) {
          const doc = deserializeDocument(d.content)
          if (doc && doc.blocks.length > 0) {
            setBlocks(doc.blocks)
            if (doc.coverImage) setCoverImage(doc.coverImage)
          } else {
            setBlocks([createBlock("paragraph", { content: d.content })])
          }
        }
        setInitialized(true)
      })
      .catch((err) => { setError(err.message); setFetching(false) })
      .finally(() => setFetching(false))
  }, [id, router])

  useEffect(() => {
    if (initialized) {
      const content = serializeDocument({ title, coverImage: coverImage || undefined, blocks })
      schedule({ title, category, excerpt, content })
    }
  }, [title, category, excerpt, coverImage, blocks, initialized, schedule])

  function handleTitleChange(val: string) {
    setTitle(val)
  }

  function handleCategoryChange(val: string) {
    setCategory(val)
  }

  function handleExcerptChange(val: string) {
    setExcerpt(val)
  }

  async function handlePublish() {
    if (!title.trim()) { toast.error("Title is required"); return }
    await saveNow()
    toast.success("Article published")
  }

  async function handleDuplicate() {
    try {
      const res = await fetch("/api/knowledge/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `${title} (Copy)`, category, excerpt, content: getContentJson() }),
      })
      if (!res.ok) throw new Error()
      const created = await res.json()
      toast.success("Article duplicated")
      router.push(`/knowledge/wiki/${created.data?.id || created.id}/edit`)
    } catch {
      toast.error("Failed to duplicate")
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch(`/api/knowledge/wiki/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Article deleted")
      router.push("/knowledge/wiki")
    } catch {
      toast.error("Failed to delete")
    }
  }

  function exportAsHtml() {
    const html = blocksToHtml(blocks)
    const blob = new Blob([html], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href = url; a.download = `${title}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  if (fetching) return <div className="animate-fade-in pb-28"><SkeletonForm fields={3} /></div>

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border/40 bg-background/90 backdrop-blur-sm">
        <div className="flex items-center justify-between h-12 px-4 lg:px-6 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="size-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <ArrowLeft className="size-4" />
            </button>
            <SaveIndicator status={status} />
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => { saveNow(); toast.success("Draft saved") }}>
              <Save className="size-3.5" /> Save
            </Button>
            <Button
              variant={showPreview ? "default" : "outline"}
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              {showPreview ? "Edit" : "Preview"}
            </Button>
            <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handlePublish}>
              <Send className="size-3.5" /> Publish
            </Button>
            <MoreMenu actions={[
              { label: "Duplicate", icon: <Copy className="size-4" />, onClick: handleDuplicate },
              { label: "Archive", icon: <Archive className="size-4" />, onClick: () => toast.info("Archived") },
              { label: "Delete", icon: <Trash2 className="size-4" />, onClick: () => setShowDelete(true) },
              { label: "Export", icon: <Download className="size-4" />, onClick: exportAsHtml },
            ]} />
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6">
        {showPreview ? (
          <ArticlePreview
            title={title}
            blocks={blocks}
            coverImage={coverImage}
            author={article?.author}
            readTime={article?.readTime}
            category={category}
            excerpt={excerpt}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
            {/* Editor canvas */}
            <div className="min-w-0 max-w-2xl mx-auto w-full">
              <input
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Title"
                className="w-full text-4xl font-bold tracking-tight text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30 pb-2 mb-4"
              />
              <ArticleEditor
                blocks={blocks}
                coverImage={coverImage}
                onBlocksChange={setBlocks}
                onCoverImageChange={setCoverImage}
                className="min-h-[60vh]"
              />
            </div>

            {/* Settings panel */}
            <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <div className="border border-border/40 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="size-4 text-primary" />
                  Article Settings
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Category</Label>
                  <Select
                    options={["Getting Started", "Inventory", "Orders", "CRM", "Reports", "Settings"].map(c => ({ value: c, label: c }))}
                    value={category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground font-medium">Excerpt</Label>
                  <textarea
                    value={excerpt}
                    onChange={(e) => handleExcerptChange(e.target.value)}
                    placeholder="Brief summary..."
                    rows={3}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                  />
                </div>
              </div>

              <div className="border border-border/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Tag className="size-4 text-primary" />
                  Status
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">State</span>
                  <SemanticBadge semantic="draft" category="status">Draft</SemanticBadge>
                </div>
                {article?.readTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Read time</span>
                    <span className="text-xs font-medium">{article.readTime}</span>
                  </div>
                )}
                {article?.author && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Author</span>
                    <span className="text-xs font-medium">{article.author}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete article</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium text-foreground">{title}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
