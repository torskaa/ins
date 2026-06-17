"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { ArrowLeft, BookOpen, Bookmark, Calendar, Clock, Edit3, Printer, Share2, Tag, ThumbsDown, ThumbsUp, User } from "lucide-react"
import { toast } from "sonner"

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

const categoryColors: Record<string, string> = {
 "Getting Started": "bg-blue-100 text-blue-700",
 "Inventory": "bg-emerald-100 text-emerald-700",
 "Orders": "bg-amber-100 text-amber-700",
 "CRM": "bg-violet-100 text-violet-700",
 "Reports": "bg-cyan-100 text-cyan-700",
 "Settings": "bg-slate-100 text-slate-700",
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
 if (!article) return (
 <div className="animate-fade-in max-w-3xl mx-auto">
 <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => router.push("/knowledge/wiki")}>
 Back to Knowledge Base
 </Button>
 <Card><CardContent className="p-8 text-center text-muted-foreground">Article not found</CardContent></Card>
 </div>
 )

 return (
 <div className="animate-fade-in max-w-3xl mx-auto">
 <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => router.push("/knowledge/wiki")}>
 Back to Knowledge Base
 </Button>

 <div className="mb-6">
 <div className="flex items-center gap-2 mb-3">
 <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${categoryColors[article.category] || "bg-surface text-muted-foreground"}`}>
 {article.category}
 </span>
 </div>
 <h1 className="text-2xl font-semibold mb-2 leading-tight">{article.title}</h1>
 <p className="text-sm text-muted-foreground mb-3">{article.excerpt}</p>
 <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
 <span className="flex items-center gap-1.5">
 <User className="w-3.5 h-3.5" />
 {article.author}
 </span>
 <span className="flex items-center gap-1.5">
 {article.readTime} read
 </span>
 <span className="flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5" />
 Updated {article.updated}
 </span>
 </div>
 </div>

 <Separator className="mb-6" />

 <div className="bg-card rounded-xl border border-border/60 p-6 mb-6">
 <div className="prose-sm max-w-none">
 {article.content?.split("\n").map((paragraph, i) => (
 paragraph.trim() ? (
 <p key={i} className="text-sm leading-relaxed text-foreground/80 mb-3 last:mb-0">{paragraph}</p>
 ) : null
 )) || (
 <p className="text-sm text-muted-foreground italic">No content available</p>
 )}
 </div>
 </div>

 <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
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
 <div className="flex items-center gap-2">
 <Button variant="ghost" size="sm" className="gap-1.5 h-8">
 Save
 </Button>
 <Button variant="ghost" size="sm" className="gap-1.5 h-8">
 <Share2 className="w-3.5 h-3.5" />
 Share
 </Button>
 <Button variant="ghost" size="sm" className="gap-1.5 h-8"><Printer className="w-4 h-4" /> Print</Button>
 <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={() => router.push(`/knowledge/wiki/${id}/edit`)}>
 Edit
 </Button>
 </div>
 </div>

 <Separator className="mb-6" />

 <div className="flex items-center justify-between">
 <div>
 <p className="text-xs text-muted-foreground">Category</p>
 <div className="flex items-center gap-1.5 mt-1">
 <Tag className="w-3.5 h-3.5 text-muted-foreground" />
 <span className="text-sm font-medium">{article.category}</span>
 </div>
 </div>
 <div className="text-right">
 <p className="text-xs text-muted-foreground">Last updated</p>
 <p className="text-sm font-medium">{article.updated}</p>
 </div>
 </div>
 </div>
 )
}
