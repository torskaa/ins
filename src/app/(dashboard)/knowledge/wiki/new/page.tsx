"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox"
import { ArrowLeft, ImagePlus, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import dynamic from "next/dynamic"
import { useArticleEditor, serializeDocument } from "@/components/article-editor"
const ArticleEditor = dynamic(() =>
  import("@/components/article-editor").then((m) => ({ default: m.ArticleEditor })),
  { ssr: false }
)

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

const categories = ["Getting Started", "Inventory", "Orders", "CRM", "Reports", "Settings"]

export default function NewWikiArticlePage() {
  const router = useRouter()
  const editor = useArticleEditor()
  const { title, coverImage, blocks, setTitle, setCoverImage, addBlock, removeBlock, updateBlock, reorderBlocks } = editor
  const [category, setCategory] = useState("Getting Started")
  const [excerpt, setExcerpt] = useState("")
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [showScheduleInline, setShowScheduleInline] = useState(false)
  const [scheduleDate, setScheduleDate] = useState("")
  const [scheduleTime, setScheduleTime] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [topics, setTopics] = useState<string[]>([])
  const [topicInput, setTopicInput] = useState("")
  const [notifySubscribers, setNotifySubscribers] = useState(true)
  const [previewImage, setPreviewImage] = useState("")
  const previewInputRef = useRef<HTMLInputElement>(null)

  function addTopic(tag: string) {
    const t = tag.trim()
    if (t && !topics.includes(t) && topics.length < 5) {
      setTopics([...topics, t])
    }
    setTopicInput("")
  }

  function removeTopic(tag: string) {
    setTopics(topics.filter((t) => t !== tag))
  }

  async function handleSchedule() {
    if (!title.trim()) { toast.error("Title is required"); return }
    if (!scheduleDate || !scheduleTime) { toast.error("Please select a date and time"); return }
    try {
      const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()
      const res = await fetch("/api/knowledge/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          subtitle,
          excerpt,
          topics,
          previewImage,
          notifySubscribers,
          scheduledAt,
          content: serializeDocument({ title, coverImage, blocks }),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Article scheduled")
      router.push("/knowledge/wiki")
    } catch { toast.error("Failed to schedule") }
  }

  async function handlePublish() {
    if (!title.trim()) { toast.error("Title is required"); return }
    try {
      const res = await fetch("/api/knowledge/wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          subtitle,
          excerpt,
          topics,
          previewImage,
          notifySubscribers,
          content: serializeDocument({ title, coverImage, blocks }),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Article published")
      router.push("/knowledge/wiki")
    } catch { toast.error("Failed to publish") }
  }

  const handlePublishRef = useRef(handlePublish)
  const handleScheduleRef = useRef(handleSchedule)
  handlePublishRef.current = handlePublish
  handleScheduleRef.current = handleSchedule

  useEffect(() => {
    if (!showPublishModal) return
    function handler(e: KeyboardEvent) {
      if (e.metaKey && e.key === "Enter") {
        e.preventDefault()
        if (showScheduleInline && scheduleDate && scheduleTime) {
          handleScheduleRef.current()
        } else {
          handlePublishRef.current()
        }
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [showPublishModal, showScheduleInline, scheduleDate, scheduleTime])

  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (showPublishModal) {
      if (coverImage && !previewImage) setPreviewImage(coverImage)
    } else {
      setPreviewImage("")
    }
  }, [showPublishModal, coverImage])

  function handlePreviewUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPreviewImage(ev.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  function handleModalTitleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setTitle(e.target.value)
    const el = titleRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = `${el.scrollHeight}px`
    }
  }

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
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => { setShowPublishModal(true); setShowScheduleInline(true) }}>
              Schedule
            </Button>
            <Button size="sm" className="h-8 text-xs" onClick={() => setShowPublishModal(true)}>
              Publish
            </Button>
          </div>

          <Dialog open={showPublishModal} onOpenChange={(v) => { setShowPublishModal(v); if (!v) setShowScheduleInline(false) }}>
            <DialogContent className="sm:max-w-[720px] p-0 gap-0">
              <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/20">
                <DialogTitle>Story preview</DialogTitle>
              </DialogHeader>
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                  {/* Left column — preview + text */}
                  <div className="md:col-span-3 space-y-6">
                    {/* Preview image */}
                    <div>
                      {previewImage ? (
                        <div className="relative rounded-xl overflow-hidden border border-border/20 bg-muted/20 aspect-[2/1]">
                          <img src={previewImage} alt="" className="w-full h-full object-cover" />
                          <button
                            onClick={() => setPreviewImage("")}
                            className="absolute top-2 right-2 size-7 flex items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                          <button
                            onClick={() => previewInputRef.current?.click()}
                            className="absolute bottom-2 left-2 text-xs px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Change
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => previewInputRef.current?.click()}
                          className="w-full aspect-[2/1] rounded-xl border-2 border-dashed border-border/30 bg-muted/10 hover:bg-surface hover:border-border/50 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground/50"
                        >
                          <ImagePlus className="size-6" />
                          <span className="text-xs">Story preview image</span>
                        </button>
                      )}
                      <input ref={previewInputRef} type="file" accept="image/*" className="hidden" onChange={handlePreviewUpload} />
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                      <textarea
                        ref={titleRef}
                        value={title}
                        onChange={handleModalTitleChange}
                        placeholder="Title"
                        rows={1}
                        className="w-full text-xl font-semibold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/30 p-0 resize-none overflow-hidden"
                      />
                      <p className="text-xs text-muted-foreground/40">{title.length}/100</p>
                    </div>

                    {/* Subtitle */}
                    <div className="space-y-1.5">
                      <input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
                        placeholder="Subtitle (optional)"
                        className="w-full text-sm text-muted-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground/30 p-0"
                      />
                      <p className="text-xs text-muted-foreground/40">{subtitle.length}/200</p>
                    </div>

                    {/* Short description */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground/60">Short description</Label>
                      <Textarea
                        value={excerpt}
                        onChange={(e) => setExcerpt(e.target.value)}
                        placeholder="A brief summary of your story..."
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>

                  {/* Right column — topics + settings */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Category */}
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground/60">Category</Label>
                        <Combobox value={category} onValueChange={(v) => setCategory(v || "Getting Started")}>
                          <ComboboxInput placeholder="Select category" showTrigger />
                          <ComboboxContent>
                            <ComboboxList>
                              {categories.map((c) => (
                                <ComboboxItem key={c} value={c}>{c}</ComboboxItem>
                              ))}
                            </ComboboxList>
                          </ComboboxContent>
                        </Combobox>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground/60">Topics</Label>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {topics.map((t) => (
                            <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border bg-transparent text-xs font-medium" style={getTopicColor(t)}>
                              {t}
                              <button onClick={() => removeTopic(t)} className="opacity-50 hover:opacity-100 transition-opacity">
                                <X className="size-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            value={topicInput}
                            onChange={(e) => setTopicInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTopic(topicInput) } }}
                            placeholder={topics.length < 5 ? "Add a topic..." : "Max 5 topics"}
                            disabled={topics.length >= 5}
                            className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground/30 p-0"
                          />
                          {topicInput.trim() && topics.length < 5 && (
                            <button
                              onClick={() => addTopic(topicInput)}
                              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
                            >
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Notify subscribers */}
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <Checkbox
                        checked={notifySubscribers}
                        onCheckedChange={(v) => setNotifySubscribers(!!v)}
                        className="mt-0.5"
                      />
                      <div className="space-y-0.5">
                        <span className="text-sm font-medium text-foreground/80">Notify your subscribers</span>
                        <p className="text-xs text-muted-foreground/50 leading-relaxed">
                          Your subscribers will receive an email notification about your new story.
                        </p>
                      </div>
                    </label>

                    {/* Disclaimer */}
                    <p className="text-xs text-muted-foreground/40 leading-relaxed">
                      Note: Changes here will affect how your story appears in public places like the homepage and in subscribers&apos; inboxes.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border/20 space-y-3">
                {showScheduleInline ? (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Input
                        type="date"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="time"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowScheduleInline(true)}
                    className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors underline underline-offset-2"
                  >
                    Schedule for later
                  </button>
                )}
                <div className="flex items-center justify-between">
                  {showScheduleInline && (
                    <button
                      onClick={() => setShowScheduleInline(false)}
                      className="text-xs text-muted-foreground/50 hover:text-foreground transition-colors underline underline-offset-2"
                    >
                      Cancel scheduling
                    </button>
                  )}
                  <div className="flex items-center gap-2 ml-auto">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setShowPublishModal(false)}>Cancel</Button>
                    <Button size="sm" className="h-8 text-xs" onClick={showScheduleInline ? handleSchedule : handlePublish}>
                      {showScheduleInline ? "Schedule to publish" : "Publish now"} <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-1">⌘↵</kbd>
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-6">
        <div className="max-w-[800px] mx-auto">
          <ArticleEditor
            title={title}
            blocks={blocks}
            coverImage={coverImage}
            onTitleChange={setTitle}
            onBlocksChange={editor.setBlocks}
            onCoverImageChange={setCoverImage}
            onAddBlock={addBlock}
            onRemoveBlock={removeBlock}
            onUpdateBlock={updateBlock}
            onReorder={reorderBlocks}
          />
        </div>
      </div>
    </div>
  )
}
