"use client"

import { useState, useEffect, use, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BlockRenderer, CoverImage } from "@/components/editor/block-renderer"
import { type Block, deserializeDocument } from "@/components/editor/types"
import { SemanticBadge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  ChevronDown,
  ChevronLeft,
  MoreHorizontal,
  Send,
  Repeat2,
  Headphones,
  BookOpen,
  ThumbsDown,
  Bold,
  Italic,
  Image,
  Play,
  Pause,
  Copy,
  Check,
  Search,
  Link,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"

type Article = {
  id: string
  title: string
  category: string
  excerpt: string
  subtitle?: string
  topics?: string[]
  coverImage?: string | null
  author: string
  updated: string
  readTime: string
  content: string
}

type Comment = {
  id: string
  author: string
  text: string
  createdAt: string
  parentId?: string
}

function getCoverImage(content?: string | null): string | null {
  if (!content) return null
  try {
    const doc = deserializeDocument(content)
    return doc?.coverImage || null
  } catch { return null }
}

function getBlocks(content?: string | null): Block[] | null {
  if (!content) return null
  const doc = deserializeDocument(content)
  return doc?.blocks || null
}

function abbreviateName(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
}

function getPlainText(content?: string | null): string {
  if (!content) return ""
  const doc = deserializeDocument(content)
  if (!doc?.blocks) return ""
  return doc.blocks.map((b) => {
    switch (b.type) {
      case "paragraph": case "heading": case "quote": case "code": return b.content
      case "list": case "bulletList": return b.items.join(". ")
      case "checklist": return b.items.map((i) => i.text).join(". ")
      default: return ""
    }
  }).filter(Boolean).join(". ")
}

const topicColors = [
  { border: "#60a5fa", text: "#2563eb" }, { border: "#34d399", text: "#059669" },
  { border: "#c084fc", text: "#7c3aed" }, { border: "#fb923c", text: "#ea580c" },
  { border: "#f472b6", text: "#db2777" }, { border: "#2dd4bf", text: "#0d9488" },
  { border: "#22d3ee", text: "#0891b2" }, { border: "#fb7185", text: "#e11d48" },
]

function langFlag(lang: string): string {
  const parts = lang.split("-")
  if (parts.length < 2) return ""
  const cc = parts[parts.length - 1].toUpperCase()
  if (cc.length !== 2) return ""
  const a = cc.charCodeAt(0)
  const b = cc.charCodeAt(1)
  if (a < 0x41 || a > 0x5a || b < 0x41 || b > 0x5a) return ""
  return String.fromCodePoint(0x1f1e6 + a - 0x41, 0x1f1e6 + b - 0x41)
}

function getTopicColor(topic: string): React.CSSProperties {
  let hash = 0
  for (let i = 0; i < topic.length; i++) hash = topic.charCodeAt(i) + ((hash << 5) - hash)
  const c = topicColors[Math.abs(hash) % topicColors.length]
  return { borderColor: c.border, color: c.text }
}

export default function WikiArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const responseEditorRef = useRef<HTMLDivElement>(null)
  const replyEditorRef = useRef<HTMLDivElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)
  const [showResponses, setShowResponses] = useState(false)
  const [liked, setLiked] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState("")
  const [responseOpen, setResponseOpen] = useState(false)
  const [claps, setClaps] = useState(0)
  const [reposts, setReposts] = useState(0)
  const [shares, setShares] = useState(0)
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())
  const [commentLikes, setCommentLikes] = useState<Record<string, number>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [collapsedThreads, setCollapsedThreads] = useState<Set<string>>(new Set())
  const [playState, setPlayState] = useState<"idle" | "playing" | "paused">("idle")
  const [copied, setCopied] = useState(false)
  const [voiceDialogOpen, setVoiceDialogOpen] = useState(false)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("")
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>("")
  const [voiceSearch, setVoiceSearch] = useState("")

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    const update = () => setVoices(window.speechSynthesis.getVoices())
    update()
    window.speechSynthesis.onvoiceschanged = update
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  useEffect(() => {
    setLoading(true)
    fetch(`/api/knowledge/wiki/${id}`)
      .then((r) => r.json())
      .then((json) => { if (json?.success) setArticle(json.data); else throw new Error(json?.error || "Failed to load"); setLoading(false) })
      .catch((err) => { setError(err.message); setLoading(false) })
  }, [id])

  function handleAddComment() {
    const html = responseEditorRef.current?.innerHTML || ""
    if (!html.trim() || html === "<br>") return
    const newComment: Comment = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      author: "You",
      text: html,
      createdAt: "Just now",
    }
    setComments((prev) => [newComment, ...prev])
    if (responseEditorRef.current) responseEditorRef.current.innerHTML = ""
    setResponseOpen(false)
    toast.success("Response added")
  }

  function handleLikeComment(commentId: string) {
    setLikedComments((prev) => {
      const wasLiked = prev.has(commentId)
      const next = new Set(prev)
      if (wasLiked) {
        next.delete(commentId)
        setCommentLikes((c) => ({ ...c, [commentId]: Math.max(0, (c[commentId] || 0) - 1) }))
      } else {
        next.add(commentId)
        setCommentLikes((c) => ({ ...c, [commentId]: (c[commentId] || 0) + 1 }))
      }
      return next
    })
  }

  function toggleThread(commentId: string) {
    setCollapsedThreads((prev) => {
      const next = new Set(prev)
      if (next.has(commentId)) next.delete(commentId)
      else next.add(commentId)
      return next
    })
  }

  function handleReply(parentId: string) {
    setReplyingTo(parentId)
    setTimeout(() => replyEditorRef.current?.focus(), 100)
  }

  function handleSubmitReply(parentId: string) {
    const html = replyEditorRef.current?.innerHTML || ""
    if (!html.trim() || html === "<br>") return
    const newComment: Comment = {
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      author: "You",
      text: html,
      createdAt: "Just now",
      parentId,
    }
    setComments((prev) => [newComment, ...prev])
    if (replyEditorRef.current) replyEditorRef.current.innerHTML = ""
    setReplyingTo(null)
    toast.success("Reply added")
  }

  function handleClap() {
    setClaps((prev) => prev + 1)
  }

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>Try again</Button>
      </div>
    </div>
  )

  if (loading) return <SkeletonDetail cards={0} hasChart={false} />
  if (!article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h2 className="text-lg font-semibold">Article not found</h2>
        <Button variant="secondary" onClick={() => router.push("/knowledge/wiki")}>Back to Knowledge Base</Button>
      </div>
    )
  }

  return (
    <>
      {/* Article */}
      <article className="max-w-[860px] mx-auto px-6 py-8">
        {/* Category */}
        <div className="mb-6 space-y-2">
          <SemanticBadge semantic={article.category} category="category">
            {article.category}
          </SemanticBadge>
          {article.topics && article.topics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {article.topics.map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 rounded-full border bg-transparent font-medium" style={getTopicColor(t)}>{t}</span>
              ))}
            </div>
          )}
        </div>

        {/* Title — 42px/52px Medium style */}
        <h1 className="text-[42px] leading-[52px] font-semibold tracking-[-0.011em] text-foreground mb-6">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-xl text-muted-foreground leading-8 mb-6">
            {article.excerpt}
          </p>
        )}

        {/* Author + meta */}
        <div className="flex items-center gap-3 mb-5">
          <Avatar className="size-11">
            <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${article.author}`} />
            <AvatarFallback>{abbreviateName(article.author)}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">{article.author}</span>
            <span className="text-sm text-muted-foreground">
              {article.readTime} · Updated {article.updated}
            </span>
          </div>
        </div>

        {/* Action bar — Left: Like, Comment, Repost | Right: Save, Listen, Share, More */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-border/20">
          <div className="flex items-center gap-1">
            <button
              onClick={handleClap}
              className="inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 rounded-lg hover:bg-surface transition-colors text-muted-foreground/60 hover:text-foreground"
            >
              <Heart className={`size-[18px] ${liked ? "fill-red-500 text-red-500" : ""}`} />
              {claps > 0 && <span className="text-sm font-medium tabular-nums">{claps}</span>}
            </button>
            <button
              onClick={() => setShowResponses(true)}
              className="inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 rounded-lg hover:bg-surface transition-colors text-muted-foreground/60 hover:text-foreground"
            >
              <MessageSquare className="size-[18px]" />
              {comments.length > 0 && <span className="text-sm font-medium tabular-nums">{comments.length}</span>}
            </button>
            <button
              onClick={() => setReposts((p) => p + 1)}
              className="inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 rounded-lg hover:bg-surface transition-colors text-muted-foreground/60 hover:text-foreground"
            >
              <Repeat2 className="size-[18px]" />
              {reposts > 0 && <span className="text-sm font-medium tabular-nums">{reposts}</span>}
            </button>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setBookmarked(!bookmarked)}
              className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-surface transition-colors text-muted-foreground/60 hover:text-foreground"
            >
              <Bookmark className={`size-[18px] ${bookmarked ? "fill-foreground text-foreground" : ""}`} />
            </button>
            <button
              onClick={() => {
                if (playState === "playing") {
                  window.speechSynthesis.pause()
                  setPlayState("paused")
                  return
                }
                if (playState === "paused") {
                  window.speechSynthesis.resume()
                  setPlayState("playing")
                  return
                }
                if (!article) return
                setVoiceDialogOpen(true)
              }}
              className="inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 rounded-lg hover:bg-surface transition-colors text-muted-foreground/60 hover:text-foreground"
            >
              {playState === "playing" ? <Pause className="size-[18px]" /> : <Headphones className="size-[18px]" />}
              <span className="text-sm font-medium">{playState === "playing" ? "Pause" : playState === "paused" ? "Resume" : "Listen"}</span>
            </button>
            <Dialog>
              <DialogTrigger asChild>
                <button className="inline-flex items-center justify-center gap-1.5 h-9 min-w-9 px-2.5 rounded-lg hover:bg-surface transition-colors text-muted-foreground/60 hover:text-foreground">
                  <Share2 className="size-[18px]" />
                  {shares > 0 && <span className="text-sm font-medium tabular-nums">{shares}</span>}
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Share link</DialogTitle>
                </DialogHeader>
                <div className="flex items-center gap-2">
                  <Input
                    ref={linkInputRef}
                    defaultValue={typeof window !== "undefined" ? window.location.href : ""}
                    className="flex-1 h-9 text-sm"
                    readOnly
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 shrink-0"
                    onClick={async () => {
                      if (linkInputRef.current) {
                        await navigator.clipboard.writeText(linkInputRef.current.value)
                        setCopied(true)
                        setShares((p) => p + 1)
                        setTimeout(() => setCopied(false), 1500)
                      }
                    }}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={voiceDialogOpen} onOpenChange={(open) => { setVoiceDialogOpen(open); if (!open) setVoiceSearch("") }}>
              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>Choose voice</DialogTitle>
                </DialogHeader>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <Input
                    value={voiceSearch}
                    onChange={(e) => setVoiceSearch(e.target.value)}
                    placeholder="Search voices..."
                    className="pl-10 h-9 rounded-md"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto -mx-1 space-y-1">
                  {voices.length === 0 && (
                    <p className="text-sm text-muted-foreground/60 py-6 text-center">
                      {typeof window !== "undefined" && !window.speechSynthesis
                        ? "Text-to-speech is not supported in this browser."
                        : "Loading voices..."}
                    </p>
                  )}
                  {voices
                    .filter((v) => {
                      if (!voiceSearch) return true
                      const q = voiceSearch.toLowerCase()
                      return v.name.toLowerCase().includes(q) || v.lang.toLowerCase().includes(q)
                    })
                    .length === 0 && voices.length > 0 && (
                      <p className="text-sm text-muted-foreground/60 py-6 text-center">No voices match your search.</p>
                    )}
                  {Object.entries(
                    voices
                      .filter((v) => {
                        if (!voiceSearch) return true
                        const q = voiceSearch.toLowerCase()
                        return v.name.toLowerCase().includes(q) || v.lang.toLowerCase().includes(q)
                      })
                      .reduce<Record<string, SpeechSynthesisVoice[]>>((acc, v) => {
                        const lang = v.lang || "unknown"
                        if (!acc[lang]) acc[lang] = []
                        acc[lang].push(v)
                        return acc
                      }, {})
                  ).map(([lang, langVoices]) => (
                    <div key={lang}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/50 px-3 pt-3 pb-1 flex items-center gap-1.5">
                        <span>{langFlag(lang) || lang}</span>
                      </p>
                      {langVoices.map((v) => (
                        <button
                          key={v.voiceURI}
                          onClick={() => { setSelectedVoiceURI(v.voiceURI); setSelectedVoiceName(v.name) }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                            selectedVoiceURI === v.voiceURI
                              ? "bg-surface text-foreground"
                              : "text-muted-foreground/70 hover:text-foreground hover:bg-surface"
                          }`}
                        >
                          <div className={`size-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                            selectedVoiceURI === v.voiceURI
                              ? "border-foreground"
                              : "border-muted-foreground/30"
                          }`}>
                            {selectedVoiceURI === v.voiceURI && (
                              <div className="size-2 rounded-full bg-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">{v.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-1">
                  <Button
                    className="w-full h-9 gap-1.5 text-sm"
                    disabled={!selectedVoiceURI}
                    onClick={() => {
                      if (!article) return
                      const text = `${article.title}. ${getPlainText(article.content)}`
                      if (!text.trim()) return
                      const utterance = new SpeechSynthesisUtterance(text)
                      const voice = voices.find((v) => v.voiceURI === selectedVoiceURI)
                      if (voice) utterance.voice = voice
                      utterance.onend = () => setPlayState("idle")
                      window.speechSynthesis.cancel()
                      window.speechSynthesis.speak(utterance)
                      setPlayState("playing")
                      setVoiceDialogOpen(false)
                      setVoiceSearch("")
                    }}
                  >
                    <Play className="size-3.5" />
                    Listen
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center justify-center size-9 rounded-lg hover:bg-surface transition-colors text-muted-foreground/60 hover:text-foreground">
                  <MoreHorizontal className="size-[18px]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="text-xs gap-3">
                  <ThumbsDown className="size-3.5" /> Show less like this
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs gap-3">
                  <span className="text-muted-foreground/50">⌘/</span> Hide highlights
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">Follow author</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">Mute author</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">Mute topics</DropdownMenuItem>
                <DropdownMenuItem className="text-xs">New</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-xs">Report story...</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Cover Image */}
        <CoverImage url={article.coverImage || getCoverImage(article.content)} />

        {/* Content — 20px/32px serif style */}
        <div className="mt-10 text-[20px] leading-[32px] tracking-[-0.003em] text-foreground/85 space-y-6 font-serif">
          <ArticleBlocksRenderer content={article.content} />
        </div>

        {/* Writer container */}
        <div className="mt-14 pt-8 border-t border-border/20">
          <div className="flex items-start gap-4">
            <Avatar className="size-14 shrink-0">
              <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${article.author}`} />
              <AvatarFallback className="text-lg">{abbreviateName(article.author)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base font-semibold text-foreground">Written by {article.author}</span>
                <span className="text-xs text-muted-foreground/50">· 1K followers</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Product engineer sharing insights on building SaaS, micro-SaaS, and tools that make developers' lives easier.
              </p>
              <Button variant="secondary" size="sm" className="mt-3 h-8 text-xs">
                Follow
              </Button>
            </div>
          </div>
        </div>

      </article>

      {/* Responses Sheet */}
      <Sheet open={showResponses} onOpenChange={setShowResponses}>
        <SheetContent side="right" className="flex flex-col p-0 gap-0">
          <SheetHeader className="px-5 py-4 border-b border-border/30 shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle>Responses ({comments.length})</SheetTitle>
            </div>
          </SheetHeader>

          <div className="px-5 py-4 border-b border-border/80 shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="size-9 shrink-0">
                <AvatarImage src="https://api.dicebear.com/7.x/notionists/svg?seed=You" />
                <AvatarFallback>YO</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">You</span>
                <span className="text-xs text-muted-foreground/60">Admin · Knowledge Base</span>
              </div>
            </div>

            {responseOpen ? (
              <div className="space-y-2">
                {/* Editor with built-in toolbar */}
                <div className="relative rounded-lg border border-border/60 bg-background focus-within:ring-1 focus-within:ring-ring">
                  <InlineToolbar />
                  <div
                    ref={responseEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-multiline="true"
                    className="w-full px-3 py-2 text-sm outline-none min-h-[80px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
                    data-placeholder="What are your thoughts?"
                    onInput={() => {
                      if (responseEditorRef.current) {
                        setCommentText(responseEditorRef.current.innerHTML)
                      }
                    }}
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setResponseOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={handleAddComment}>
                    Respond
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setResponseOpen(true)}
                className="w-full rounded-lg border border-border/30 bg-transparent px-3 py-2.5 text-sm text-left text-muted-foreground/50 hover:text-muted-foreground hover:border-border/60 transition-colors"
              >
                What are your thoughts?
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {comments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare className="size-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground/60">No responses yet</p>
                <p className="text-xs text-muted-foreground/40 mt-1">Be the first to share your thoughts</p>
              </div>
            ) : (
              comments.filter((c) => !c.parentId).map((comment) => (
                <div key={comment.id} className="border-b border-border/80 pb-4 last:border-b-0 last:pb-0">
                  <CommentThread
                    comment={comment}
                    depth={0}
                    comments={comments}
                    likedComments={likedComments}
                    commentLikes={commentLikes}
                    replyingTo={replyingTo}
                    collapsedThreads={collapsedThreads}
                    replyEditorRef={replyEditorRef}
                    onLike={handleLikeComment}
                    onReply={handleReply}
                    onSubmitReply={handleSubmitReply}
                    onCancelReply={() => setReplyingTo(null)}
                    onToggle={toggleThread}
                  />
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {(playState === "playing" || playState === "paused") && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-2xl border border-border/40 bg-background/95 backdrop-blur-sm shadow-lg shadow-black/5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-foreground/60" />
              </span>
              <span className="text-xs font-medium text-foreground/60">Listening</span>
            </div>
            <div className="w-px h-4 bg-border/60" />
            <div className="min-w-0 max-w-[200px]">
              <p className="text-sm font-semibold text-foreground truncate">{selectedVoiceName}</p>
              <p className="text-xs text-muted-foreground/60 truncate">{article?.title}</p>
            </div>
          </div>
          <button
            onClick={() => {
              if (playState === "playing") { window.speechSynthesis.pause(); setPlayState("paused") }
              else { window.speechSynthesis.resume(); setPlayState("playing") }
            }}
            className="size-8 flex items-center justify-center rounded-xl hover:bg-surface transition-colors text-muted-foreground/50 hover:text-foreground shrink-0"
            title={playState === "playing" ? "Pause" : "Resume"}
          >
            {playState === "playing" ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
        </div>
      )}
    </>
  )
}

function CommentThread({
  comment,
  depth,
  comments,
  likedComments,
  commentLikes,
  replyingTo,
  collapsedThreads,
  replyEditorRef,
  onLike,
  onReply,
  onSubmitReply,
  onCancelReply,
  onToggle,
}: {
  comment: Comment
  depth: number
  comments: Comment[]
  likedComments: Set<string>
  commentLikes: Record<string, number>
  replyingTo: string | null
  collapsedThreads: Set<string>
  replyEditorRef: React.RefObject<HTMLDivElement | null>
  onLike: (id: string) => void
  onReply: (id: string) => void
  onSubmitReply: (parentId: string) => void
  onCancelReply: () => void
  onToggle: (id: string) => void
}) {
  const indent = depth === 0 ? "ml-10" : "ml-9"
  const replies = comments.filter((c) => c.parentId === comment.id)
  const isCollapsed = collapsedThreads.has(comment.id)

  return (
    <div className="space-y-1">
      <div className={`flex items-start gap-2.5 ${replies.length > 0 ? "cursor-pointer select-none" : ""}`} onClick={() => replies.length > 0 && onToggle(comment.id)}>
        {replies.length > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(comment.id) }}
            className="mt-1.5 shrink-0 text-muted-foreground/30 hover:text-muted-foreground transition-colors"
          >
            <ChevronDown className={`size-3 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {replies.length > 0 && (
          <span className="text-[10px] text-muted-foreground/30 font-medium tabular-nums">{replies.length}</span>
        )}
        <Avatar className={`shrink-0 ${depth === 0 ? "size-8" : "size-7"}`}>
          <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${comment.author}`} />
          <AvatarFallback>{abbreviateName(comment.author)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-foreground">{comment.author}</span>
          <span className="text-xs text-muted-foreground/60">Admin · Knowledge Base</span>
        </div>
      </div>
      <div className={indent}>
        <p className="text-sm text-foreground/80" dangerouslySetInnerHTML={{ __html: comment.text }} />
        <p className="text-xs text-muted-foreground/40 mt-1">{comment.createdAt}</p>
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onLike(comment.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <Heart className={`size-3 ${likedComments.has(comment.id) ? "fill-red-500 text-red-500" : ""}`} /> Like{commentLikes[comment.id] ? <span className="tabular-nums">{commentLikes[comment.id]}</span> : ""}
          </button>
          <button
            onClick={() => onReply(comment.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <MessageSquare className="size-3" /> Reply
          </button>
        </div>
      </div>

      {/* Reply editor */}
      {replyingTo === comment.id && (
        <div className={`${indent} mt-2 space-y-2`}>
          <div className="relative rounded-lg border border-border/60 bg-background focus-within:ring-1 focus-within:ring-ring">
            <InlineToolbar />
            <div
              ref={replyEditorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-multiline="true"
              className="w-full px-3 py-2 text-sm outline-none min-h-[60px] empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
              data-placeholder="Write a reply..."
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancelReply}>Cancel</Button>
            <Button size="sm" className="h-7 text-xs" onClick={() => onSubmitReply(comment.id)}>
              Reply
            </Button>
          </div>
        </div>
      )}

      {/* Nested replies */}
      {!isCollapsed && replies.length > 0 && (
        <div className={`${depth === 0 ? "ml-5 mt-3" : "ml-5 mt-2"} border-l-[3px] border-border/80 pl-3 space-y-3`}>
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              comments={comments}
              likedComments={likedComments}
              commentLikes={commentLikes}
              replyingTo={replyingTo}
              collapsedThreads={collapsedThreads}
              replyEditorRef={replyEditorRef}
              onLike={onLike}
              onReply={onReply}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function InlineToolbar() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) return
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const json = await res.json()
      document.execCommand("insertImage", false, json.data?.url || json.url)
    } catch {
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        if (url) document.execCommand("insertImage", false, url)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="flex items-center gap-0.5 px-2 pt-1.5 pb-0.5 border-b border-border/20">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); document.execCommand("bold") }}
        className="size-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-surface transition-colors"
        title="Bold"
      >
        <Bold className="size-3.5" />
      </button>
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); document.execCommand("italic") }}
        className="size-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-surface transition-colors"
        title="Italic"
      >
        <Italic className="size-3.5" />
      </button>
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="size-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-surface transition-colors"
          title="Upload image"
        >
          <Image className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt("Enter link URL:")
            if (url) document.execCommand("createLink", false, url)
          }}
          className="size-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-foreground hover:bg-surface transition-colors"
          title="Insert link"
        >
          <Link className="size-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f) }}
        />
      </div>
    </div>
  )
}

function ArticleBlocksRenderer({ content }: { content?: string }) {
  if (!content) {
    return <p className="text-muted-foreground italic">No content available</p>
  }

  const blocks = getBlocks(content)
  if (blocks && blocks.length > 0) {
    return (
      <div className="space-y-6">
        {blocks.map((block) => (
          <BlockRenderer key={block.id} block={block} />
        ))}
      </div>
    )
  }

  return (
    <>
      {content.split("\n").map((paragraph, i) => (
        paragraph.trim() ? (
          <p key={i} className="leading-relaxed">{paragraph}</p>
        ) : null
      ))}
    </>
  )
}
