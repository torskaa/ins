"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SemanticBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { AlertTriangle, Search, FileText, BookOpen, Layers } from "lucide-react"
import { SkeletonText } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

type Article = {
 id: string
 title: string
 category: string
 excerpt: string
 author: string
 updated: string
 readTime: string
}

const categories = ["Getting Started", "Inventory", "Orders", "CRM", "Reports", "Settings"]

export default function WikiPage() {
 const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
 const [search, setSearch] = useState("")
 const [activeCategory, setActiveCategory] = useState<string | null>(null)
 const handleNew = useCallback(() => router.push("/knowledge/wiki/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/knowledge/wiki")
 .then((r) => r.json())
 .then((json) => { if (json?.success) setArticles(json.data); else throw new Error(json?.error || "Failed to load"); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
 }, [])

 const filtered = articles.filter((a) => {
 const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase())
 const matchesCategory = !activeCategory || a.category === activeCategory
 return matchesSearch && matchesCategory
 })

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Knowledge Base</h1>
 <p>Wiki articles, guides, and documentation</p>
 </div>
 <Button className="gap-1.5" onClick={handleNew}>New Article <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>

 <div className="relative mb-6">
 <Input
 placeholder="Search articles..."
 className="pl-9 h-10"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>

 <div className="flex gap-2 flex-wrap mb-6">
 <button
 onClick={() => setActiveCategory(null)}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
 !activeCategory ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
 }`}
 >
 All
 </button>
 {categories.map((cat) => (
 <button
 key={cat}
 onClick={() => setActiveCategory(cat)}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
 activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground hover:text-foreground"
 }`}
 >
 {cat}
 </button>
 ))}
 </div>

  {error ? (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  ) : loading ? (
  <div className="space-y-3">
  {[1, 2, 3].map((i) => <SkeletonText key={i} lines={2} />)}
  </div>
 ) : (
 <div className="grid gap-3">
 {filtered.map((article) => (
 <Card key={article.id} className="card-hover card-shadow cursor-pointer group" onClick={() => router.push(`/knowledge/wiki/${article.id}`)}>
 <CardContent className="p-4">
 <div className="flex items-start justify-between">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <h3 className="font-medium text-sm group-hover:text-primary transition-colors truncate">{article.title}</h3>
 </div>
 <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{article.excerpt}</p>
 <div className="flex items-center gap-3 text-xs text-muted-foreground">
  <SemanticBadge semantic={article.category} category="category" className="text-[10px] px-1.5 py-0">{article.category}</SemanticBadge>
 <span className="flex items-center gap-1">{article.readTime}</span>
 <span>Updated {article.updated}</span>
 </div>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
  {filtered.length === 0 && (
  <EmptyState
  icons={[<FileText key="wk1" className="w-6 h-6" />, <BookOpen key="wk2" className="w-6 h-6" />, <Layers key="wk3" className="w-6 h-6" />]}
  title="No articles found"
  description="No wiki articles match your search criteria"
  size="sm"
  />
  )}
 </div>
 )}
 </div>
 )
}
