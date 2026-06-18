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
import { BookOpen, Calendar, Clock, Edit3, Printer, Share2, Tag, ThumbsDown, ThumbsUp, User } from "lucide-react"
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
        <Badge variant={value === "active" ? "success" : "secondary"} className="capitalize">{value}</Badge>
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

  useEffect(() => {
    setLoading(true)
    fetch(`/api/knowledge/wiki/${id}`)
      .then((r) => r.json())
      .then((data) => { setArticle(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [id])

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
                  <SemanticBadge semantic={article.category} category="category" appearance="outline" className="gap-1 text-[11px]"><Tag className="w-3 h-3" />{article.category}</SemanticBadge>
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
                { label: "Edit", icon: <Edit3 className="w-4 h-4" />, onClick: () => router.push(`/knowledge/wiki/${id}/edit`) },
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
    </div>
  )
}
