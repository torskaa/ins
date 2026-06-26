"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { SemanticBadge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useHotkey } from "@/hooks/use-hotkey"
import { abbreviateName } from "@/lib/utils"
import { AlertTriangle, Search, FileText, BookOpen, Layers, Eye, MessageSquare, Bookmark, Share2, MoreHorizontal, ArrowUpDown, Clock, ChevronDown, Heart } from "lucide-react"
import { SkeletonText } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { deserializeDocument } from "@/components/editor/types"
import { cn } from "@/lib/utils"

const topicColors = [
  { border: "#60a5fa", text: "#2563eb" }, { border: "#34d399", text: "#059669" },
  { border: "#c084fc", text: "#7c3aed" }, { border: "#fb923c", text: "#ea580c" },
  { border: "#f472b6", text: "#db2777" }, { border: "#2dd4bf", text: "#0d9488" },
  { border: "#22d3ee", text: "#0891b2" }, { border: "#fb7185", text: "#e11d48" },
]

function getTopicColor(topic: string): React.CSSProperties {
  let hash = 0
  for (let i = 0; i < topic.length; i++) hash = topic.charCodeAt(i) + ((hash << 5) - hash)
  const c = topicColors[Math.abs(hash) % topicColors.length]
  return { borderColor: c.border, color: c.text }
}

type Article = {
  id: string
  title: string
  category: string
  excerpt: string
  author: string
  updated: string
  readTime: string
  content?: string | null
  views?: number
  commentsCount?: number
  likes?: number
  topics?: string[]
}

const categories = ["Getting Started", "Inventory", "Orders", "CRM", "Reports", "Settings"]

const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "most-viewed", label: "Most viewed" },
] as const

function getArticleStatus(content?: string | null): "Draft" | "Published" {
  if (!content || content === "{}" || content === `{"title":"","blocks":[]}`) return "Draft"
  try {
    const doc = deserializeDocument(content)
    if (!doc || doc.blocks.length === 0 || (doc.blocks.length === 1 && doc.blocks[0].type === "paragraph" && !doc.blocks[0].content)) {
      return "Draft"
    }
  } catch { /* not JSON, fall through */ }
  return "Published"
}

function getCoverImage(content?: string | null): string | null {
  if (!content) return null
  try {
    const doc = deserializeDocument(content)
    return doc?.coverImage || null
  } catch {
    return null
  }
}

function PlaceholderThumbnail({ title, category }: { title: string; category: string }) {
  const colorMap: Record<string, string> = {
    "Getting Started": "from-blue-500/20 to-blue-600/10 text-blue-600",
    "Inventory": "from-emerald-500/20 to-emerald-600/10 text-emerald-600",
    "Orders": "from-amber-500/20 to-amber-600/10 text-amber-600",
    "CRM": "from-violet-500/20 to-violet-600/10 text-violet-600",
    "Reports": "from-rose-500/20 to-rose-600/10 text-rose-600",
    "Settings": "from-slate-500/20 to-slate-600/10 text-slate-600",
  }
  const gradient = colorMap[category] || "from-muted/50 to-muted/30 text-muted-foreground"
  return (
    <div className={cn("w-full h-full flex items-center justify-center bg-gradient-to-br rounded-lg", gradient)}>
      <span className="text-lg font-bold opacity-40">{title.charAt(0).toUpperCase()}</span>
    </div>
  )
}

export default function WikiPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeStatus, setActiveStatus] = useState<string | null>(null)
  const [sort, setSort] = useState<"latest" | "popular" | "most-viewed">("latest")
  const [showSortMenu, setShowSortMenu] = useState(false)

  const handleNew = useCallback(() => router.push("/knowledge/wiki/new"), [router])
  useHotkey("c", handleNew)

  useEffect(() => {
    fetch("/api/knowledge/wiki")
      .then((r) => r.json())
      .then((json) => { if (json?.success) setArticles(json.data); else throw new Error(json?.error || "Failed to load"); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [])

  const sorted = useMemo(() => {
    const list = [...articles]
    switch (sort) {
      case "popular":
      case "most-viewed":
        break
      case "latest":
      default:
        break
    }
    return list
  }, [articles, sort])

  const filtered = sorted.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt?.toLowerCase().includes(search.toLowerCase()) || false
    const matchesCategory = !activeCategory || a.category === activeCategory
    const status = getArticleStatus(a.content)
    const matchesStatus = !activeStatus || status === activeStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-1">Wiki articles, guides, and documentation</p>
        </div>
        <Button className="gap-1.5 shrink-0" onClick={handleNew}>
          New Article
          <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd>
        </Button>
      </div>

      {/* Filters row */}
      <div className="space-y-4 mb-8">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <Input
            placeholder="Search articles..."
            className="pl-9 h-10 rounded-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category + Status + Sort */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 flex-wrap">
            <FilterChip active={!activeCategory} onClick={() => setActiveCategory(null)}>All</FilterChip>
            {categories.map((cat) => (
              <FilterChip key={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)}>{cat}</FilterChip>
            ))}
          </div>
          <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />
          <div className="flex gap-1">
            {["Draft", "Published"].map((s) => (
              <FilterChip key={s} active={activeStatus === s} onClick={() => setActiveStatus(activeStatus === s ? null : s)}>{s}</FilterChip>
            ))}
          </div>
          <div className="w-px h-5 bg-border/60 mx-1 hidden sm:block" />
          <div className="relative">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
            >
              <ArrowUpDown className="size-3" />
              {sortOptions.find((o) => o.value === sort)?.label}
              <ChevronDown className="size-3" />
            </button>
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)} />
                <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-border/60 bg-background shadow-lg p-1">
                  {sortOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setShowSortMenu(false) }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                        sort === opt.value ? "bg-muted/50 text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="animate-fade-in pb-8 space-y-4">
          <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
        </div>
      ) : loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => <SkeletonText key={i} lines={4} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icons={[<FileText key="wk1" className="w-6 h-6" />, <BookOpen key="wk2" className="w-6 h-6" />, <Layers key="wk3" className="w-6 h-6" />]}
          title={search || activeCategory ? "No articles found" : "No articles yet"}
          description={search || activeCategory ? "Try adjusting your search or filters" : "Create your first article to start building your knowledge base"}
          size="sm"
        />
      ) : (
        <div className="divide-y divide-border/30">
          {filtered.map((article) => (
            <ArticleFeedCard
              key={article.id}
              article={article}
              onSelect={() => router.push(`/knowledge/wiki/${article.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface",
      )}
    >
      {children}
    </button>
  )
}

function ArticleFeedCard({ article, onSelect }: { article: Article; onSelect: () => void }) {
  const coverImage = getCoverImage(article.content)

  return (
    <article className="group py-6 first:pt-0 last:pb-0 cursor-pointer" onClick={onSelect}>
      <div className="flex items-start gap-6">
        {/* Left content */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Author + Date */}
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <Avatar className="size-5">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(article.author)}`} alt={article.author} />
              <AvatarFallback className="text-[9px]">{abbreviateName(article.author).charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground/80">{article.author}</span>
            <span className="text-muted-foreground/30">·</span>
            <span>Updated {article.updated}</span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold tracking-tight text-foreground leading-snug group-hover:text-primary transition-colors">
            {article.title}
          </h2>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {article.excerpt}
            </p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-2 flex-wrap">
            {article.topics && article.topics.length > 0 ? (
              article.topics.map((t) => (
                <span key={t} className="text-[11px] px-1.5 py-0.5 rounded-full border bg-transparent font-medium" style={getTopicColor(t)}>{t}</span>
              ))
            ) : (
              <SemanticBadge semantic={article.category} category="category" className="text-[10px] px-1.5 py-0" />
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3" /> {article.readTime} read
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 text-muted-foreground/60">
            <button
              onClick={(e) => { e.stopPropagation() }}
              className="flex items-center gap-1 text-xs hover:text-muted-foreground transition-colors"
              title="Views"
            >
              <Eye className="size-3.5" /> {article.views ? <span>{article.views}</span> : null}
            </button>
            <button
              onClick={(e) => { e.stopPropagation() }}
              className="flex items-center gap-1 text-xs hover:text-muted-foreground transition-colors"
              title="Comments"
            >
              <MessageSquare className="size-3.5" /> {article.commentsCount ? <span>{article.commentsCount}</span> : null}
            </button>
            <button
              onClick={(e) => { e.stopPropagation() }}
              className="flex items-center gap-1 text-xs hover:text-muted-foreground transition-colors"
              title="Likes"
            >
              <Heart className="size-3.5" /> {article.likes ? <span>{article.likes}</span> : null}
            </button>
            <button
              onClick={(e) => { e.stopPropagation() }}
              className="flex items-center gap-1 text-xs hover:text-muted-foreground transition-colors ml-auto"
              title="Share"
            >
              <Share2 className="size-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onSelect() }}
              className="flex items-center gap-1 text-xs hover:text-muted-foreground transition-colors"
              title="More"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Cover image */}
        <div className="hidden sm:block w-28 h-28 shrink-0 rounded-lg overflow-hidden border border-border/20 mt-1">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none"
                ;(e.target as HTMLImageElement).parentElement!.classList.add("bg-muted/30")
              }}
            />
          ) : (
            <PlaceholderThumbnail title={article.title} category={article.category} />
          )}
        </div>
      </div>
    </article>
  )
}
