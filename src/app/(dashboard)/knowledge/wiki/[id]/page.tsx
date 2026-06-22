"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, BookOpen, Calendar, Clock, Edit3, Printer, Share2, Tag, ThumbsDown, ThumbsUp, User } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { formatCurrency, formatNumber, formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

type Article = {
  id: string
  title: string
  category: string
  excerpt: string
  author: string
  updated: string
  readTime: string
  content: string
}

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      {badge ? (
        <SemanticBadge semantic={value} category="status">{value}</SemanticBadge>
      ) : (
        <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
      )}
    </div>
  )
}

function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export default function WikiArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/knowledge/wiki/${id}`)
      .then((r) => r.json())
      .then((json) => { if (json?.success) setArticle(json.data); else throw new Error(json?.error || "Failed to load"); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/knowledge/wiki/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          excerpt: form.excerpt,
          content: form.content,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setArticle(updated)
      setShowEdit(false)
      toast.success("Article updated")
    } catch {
      toast.error("Failed to update article")
    } finally {
      setSaving(false)
    }
  }

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )

  if (loading) return <SkeletonDetail cards={0} hasChart={false} />
  if (!article) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Article not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The article you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/knowledge/wiki")}>Back to Knowledge Base</Button>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/knowledge/wiki")}>Knowledge Base</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{article.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header — bento card */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{article.title}</h1>
                  <SemanticBadge semantic={article.category} category="category" className="gap-1 text-[11px]"><Tag className="w-3 h-3" />{article.category}</SemanticBadge>
                </div>
                {article.excerpt && (
                  <p className="text-sm text-muted-foreground">{article.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    {article.author}
                  </span>
                  <span className="text-muted-foreground/30">·</span>
                  <span>{article.readTime} read</span>
                  <span className="text-muted-foreground/30">·</span>
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Updated {article.updated}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="ghost" size="sm" className="gap-1.5 h-8">Save</Button>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8"><Share2 className="w-3.5 h-3.5" /> Share</Button>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8"><Printer className="w-4 h-4" /> Print</Button>
              <MoreMenu actions={[
                { label: "Edit", icon: <Edit3 className="w-4 h-4" />, onClick: () => { setForm({ title: article.title, category: article.category, excerpt: article.excerpt || "", content: article.content || "" }); setShowEdit(true) } },
              ]} />
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) — Primary Information */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Article Content */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="w-4 h-4 text-primary" />
                Article Content
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="prose-sm max-w-none">
                {article.content?.split("\n").map((paragraph, i) => (
                  paragraph.trim() ? (
                    <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-3 last:mb-0">{paragraph}</p>
                  ) : null
                )) || (
                  <p className="text-sm text-muted-foreground italic">No content available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">Was this article helpful?</p>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="gap-1.5 h-8">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      Yes
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8">
                      <ThumbsDown className="w-3.5 h-3.5" />
                      No
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) — Contextual / Meta */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Overview */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="w-4 h-4 text-primary" />
                Overview
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5"><User className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Author</span><span className="text-sm font-medium ml-auto">{article.author}</span></div>
                <div className="flex items-center gap-2.5"><Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Read Time</span><span className="text-sm font-medium ml-auto">{article.readTime}</span></div>
                <div className="flex items-center gap-2.5"><Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Category</span><span className="text-sm font-medium ml-auto">{article.category}</span></div>
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Last Updated" value={article.updated} />
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Article</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{article?.title}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Article Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Title" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Category"><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Guides, FAQ" /></FieldGroup>
                </div>
                <FieldGroup label="Excerpt"><Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} placeholder="Brief summary..." /></FieldGroup>
                <FieldGroup label="Content"><Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={8} placeholder="Write your article content..." /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="secondary" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
