"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { RefreshCw, FileText, FileSpreadsheet, Layout, Copy, Download, Loader2 } from "lucide-react"
import { useDashboardStore } from "./dashboard-store"
import { WIDGET_REGISTRY } from "./widget-registry"

interface ModalProps {
 open: boolean
 onOpenChange: (open: boolean) => void
}

const SYNC_STEPS = [
 { label: "Connecting to source...", pct: 10 },
 { label: "Fetching changed files...", pct: 30 },
 { label: "Comparing versions...", pct: 50 },
 { label: "Applying updates...", pct: 70 },
 { label: "Verifying integrity...", pct: 88 },
 { label: "Sync complete", pct: 100 },
]

function SyncToolModal({ open, onOpenChange }: ModalProps) {
 const [source, setSource] = useState("")
 const [dest, setDest] = useState("")
 const [syncing, setSyncing] = useState(false)
 const [stepIdx, setStepIdx] = useState(0)

 useEffect(() => {
 if (!syncing) return
 const t = setTimeout(() => {
 if (stepIdx < SYNC_STEPS.length - 1) setStepIdx((s) => s + 1)
 else { setSyncing(false); setTimeout(() => onOpenChange(false), 1200) }
 }, 600)
 return () => clearTimeout(t)
 }, [syncing, stepIdx, onOpenChange])

 const handleSync = useCallback(() => {
 if (!source || !dest) return
 setSyncing(true)
 setStepIdx(0)
 }, [source, dest])

 const step = SYNC_STEPS[stepIdx]

 return (
 <Dialog open={open} onOpenChange={(o) => { if (!o) { setSource(""); setDest(""); setSyncing(false); setStepIdx(0) }; onOpenChange(o) }}>
 <DialogContent
 className="sm:max-w-md !rounded-2xl !p-0 gap-0 overflow-hidden max-sm:!rounded-none max-sm:h-full max-sm:max-h-full max-sm:!border-0"
 onKeyDown={(e) => {
 if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); if (!syncing) handleSync() }
 }}
 >
 <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
 <div className="flex items-center gap-2.5">
 <RefreshCw className={`w-5 h-5 text-muted-foreground ${syncing ? "animate-spin" : ""}`} />
 <DialogTitle>Sync Tool</DialogTitle>
 </div>
 </DialogHeader>

 <div className="px-6 py-5 space-y-4">
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Source</label>
 <div className="flex rounded-lg border border-border overflow-hidden">
 {["Google Drive", "Dropbox", "Local"].map((s) => (
 <button key={s} onClick={() => setSource(s)}
 className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${source === s ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-surface"}`}
 >{s}</button>
 ))}
 </div>
 </div>
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Destination</label>
 <div className="flex rounded-lg border border-border overflow-hidden">
 {["Dashboard", "Archive", "External"].map((d) => (
 <button key={d} onClick={() => setDest(d)}
 className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${dest === d ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-surface"}`}
 >{d}</button>
 ))}
 </div>
 </div>

 {syncing && (
 <div className="space-y-2">
 <div className="flex items-center justify-between text-xs text-muted-foreground">
 <span className="flex items-center gap-1.5">
 {step.pct < 100 ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
 {step.label}
 </span>
 <span>{step.pct}%</span>
 </div>
 <div className="w-full h-2 rounded-full bg-surface overflow-hidden">
 <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${step.pct}%` }} />
 </div>
 </div>
 )}
 </div>

 <div className="px-6 pb-6 pt-3 border-t border-border/40 flex items-center justify-between">
 <span className="text-xs text-muted-foreground">{source || "—"} → {dest || "—"}</span>
 <Button onClick={handleSync} disabled={!source || !dest || syncing} size="sm">
 {syncing ? "Syncing..." : <>Sync Now <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></>}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}

function ExportPDFModal({ open, onOpenChange }: ModalProps) {
 const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait")
 const [printAll, setPrintAll] = useState(true)

 const handleExport = useCallback(() => {
 const style = document.createElement("style")
 style.textContent = `
 @page { size: ${orientation}; margin: 16mm; }
 @media print {
 body * { visibility: hidden; }
 #dashboard-print-area, #dashboard-print-area * { visibility: visible; }
 #dashboard-print-area { position: absolute; left: 0; top: 0; width: 100%; }
 }
 `
 document.head.appendChild(style)
 window.print()
 document.head.removeChild(style)
 onOpenChange(false)
 }, [orientation, onOpenChange])

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent
 className="sm:max-w-md !rounded-2xl !p-0 gap-0 overflow-hidden max-sm:!rounded-none max-sm:h-full max-sm:max-h-full max-sm:!border-0"
 onKeyDown={(e) => {
 if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleExport() }
 }}
 >
 <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
 <div className="flex items-center gap-2.5">
 <DialogTitle>Export as PDF</DialogTitle>
 </div>
 </DialogHeader>

 <div className="px-6 py-5 space-y-5">
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Orientation</label>
 <div className="flex rounded-lg border border-border overflow-hidden">
 {(["portrait", "landscape"] as const).map((o) => (
 <button key={o} onClick={() => setOrientation(o)}
 className={`flex-1 px-4 py-1.5 text-xs font-medium capitalize transition-colors ${orientation === o ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-surface"}`}
 >{o}</button>
 ))}
 </div>
 </div>
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Pages</label>
 <div className="space-y-2">
 {[{ value: true, label: "All widgets" }, { value: false, label: "Visible widgets only" }].map((p) => (
 <label key={p.label} className="flex items-center gap-2.5 cursor-pointer">
 <div onClick={() => setPrintAll(p.value)}
 className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${printAll === p.value ? "border-primary" : "border-border"}`}
 >
 {printAll === p.value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
 </div>
 <span className="text-sm text-foreground">{p.label}</span>
 </label>
 ))}
 </div>
 </div>
 </div>

 <div className="px-6 pb-6 pt-3 border-t border-border/40 flex items-center justify-between">
 <span className="text-xs text-muted-foreground capitalize">{orientation} · {printAll ? "all" : "visible"}</span>
 <Button onClick={handleExport} size="sm">
 Export PDF <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd>
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}

const CSV_COLUMNS = ["Month", "Revenue", "Cost", "Profit", "Margin", "Product", "Category"]

function ExportCSVModal({ open, onOpenChange }: ModalProps) {
 const [selected, setSelected] = useState<string[]>([...CSV_COLUMNS])

 const toggleColumn = useCallback((col: string) => {
 setSelected((prev) => prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col])
 }, [])

 const handleExport = useCallback(() => {
 if (selected.length === 0) return
 const headers = selected
 const rows: string[] = []
 const row: Record<string, string> = {
 Month: "January", Revenue: "42500", Cost: "28500",
 Profit: "14000", Margin: "32.9", Product: "Widget A", Category: "Electronics"}
 rows.push(selected.map((col) => `"${(row[col] || "").replace(/"/g, '""')}"`).join(","))
 const csv = headers.map((h) => `"${h}"`).join(",") + "\n" + rows.join("\n")
 const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
 const url = URL.createObjectURL(blob)
 const a = document.createElement("a")
 a.href = url; a.download = `dashboard-export-${Date.now()}.csv`
 a.click()
 URL.revokeObjectURL(url)
 onOpenChange(false)
 }, [selected, onOpenChange])

 return (
 <Dialog open={open} onOpenChange={(o) => { if (!o) setSelected([...CSV_COLUMNS]); onOpenChange(o) }}>
 <DialogContent
 className="sm:max-w-md !rounded-2xl !p-0 gap-0 overflow-hidden max-sm:!rounded-none max-sm:h-full max-sm:max-h-full max-sm:!border-0"
 onKeyDown={(e) => {
 if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleExport() }
 }}
 >
 <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
 <div className="flex items-center gap-2.5">
 <FileSpreadsheet className="w-5 h-5 text-muted-foreground" />
 <DialogTitle>Export as CSV</DialogTitle>
 </div>
 </DialogHeader>

 <div className="px-6 py-5">
 <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-3">Columns to export</h3>
 <div className="space-y-2.5">
 {CSV_COLUMNS.map((col) => {
 const checked = selected.includes(col)
 return (
 <label key={col} className="flex items-center gap-2.5 cursor-pointer">
 <div onClick={() => toggleColumn(col)}
 className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${checked ? "bg-primary border-primary" : "border-border"}`}
 >{}</div>
 <span className="text-sm text-foreground">{col}</span>
 </label>
 )
 })}
 </div>
 </div>

 <div className="px-6 pb-6 pt-3 border-t border-border/40 flex items-center justify-between">
 <span className="text-xs text-muted-foreground">{selected.length} of {CSV_COLUMNS.length} columns</span>
 <Button onClick={handleExport} disabled={selected.length === 0} size="sm">
 Download CSV <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd>
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}

function ShareModal({ open, onOpenChange }: ModalProps) {
 const [copied, setCopied] = useState(false)
 const [permission, setPermission] = useState<"view" | "edit" | "full">("view")
 const shareUrl = typeof window !== "undefined" ? window.location.href : ""

 const handleCopy = useCallback(() => {
 navigator.clipboard.writeText(shareUrl).then(() => {
 setCopied(true)
 setTimeout(() => setCopied(false), 2000)
 })
 }, [shareUrl])

 return (
 <Dialog open={open} onOpenChange={(o) => { if (!o) setCopied(false); onOpenChange(o) }}>
 <DialogContent
 className="sm:max-w-md !rounded-2xl !p-0 gap-0 overflow-hidden max-sm:!rounded-none max-sm:h-full max-sm:max-h-full max-sm:!border-0"
 onKeyDown={(e) => {
 if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleCopy() }
 }}
 >
 <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
 <div className="flex items-center gap-2.5">
 <DialogTitle>Share Dashboard</DialogTitle>
 </div>
 </DialogHeader>

 <div className="px-6 py-5 space-y-4">
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Dashboard link</label>
 <div className="flex items-center gap-2">
 <input type="text" value={shareUrl} readOnly
 className="flex-1 h-9 px-3 rounded-lg border border-border text-sm text-muted-foreground bg-card font-mono select-all focus:outline-none"
 />
  <Tooltip>
  <TooltipTrigger asChild>
  <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleCopy}>
  <Copy className="w-4 h-4" />
  </Button>
  </TooltipTrigger>
  <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
  <p className="text-sm font-medium">Copy</p>
  <p className="text-background/70 text-xs leading-snug">
    Copy to clipboard
  </p>
</TooltipContent>
  </Tooltip>
 </div>
 </div>
 <div>
 <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Permission</label>
 <div className="flex rounded-lg border border-border overflow-hidden">
 {[
 { value: "view" as const, label: "View only" },
 { value: "edit" as const, label: "Can edit" },
 { value: "full" as const, label: "Full access" },
 ].map((p) => (
 <button key={p.value} onClick={() => setPermission(p.value)}
 className={`flex-1 px-2 py-1.5 text-xs font-medium transition-colors ${permission === p.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-surface"}`}
 >{p.label}</button>
 ))}
 </div>
 </div>
 </div>

 <div className="px-6 pb-6 pt-3 border-t border-border/40 flex items-center justify-between">
 <span className="text-xs text-muted-foreground">{permission === "view" ? "View only" : permission === "edit" ? "Can edit" : "Full access"}</span>
 <Button onClick={handleCopy} size="sm">
 {copied ? <>Copied</> : <>Copy Link <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></>}
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}

function LayoutSettingsModal({ open, onOpenChange }: ModalProps) {
 const { resetLayout } = useDashboardStore()
 const [compact, setCompact] = useState(false)

 const handleApply = useCallback(() => {
 if (compact) {
 document.documentElement.style.setProperty("--dashboard-row-height", "80px")
 } else {
 document.documentElement.style.setProperty("--dashboard-row-height", "100px")
 }
 onOpenChange(false)
 }, [compact, onOpenChange])

 const handleResetLayout = useCallback(() => {
 resetLayout()
 onOpenChange(false)
 }, [resetLayout, onOpenChange])

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent
 className="sm:max-w-md !rounded-2xl !p-0 gap-0 overflow-hidden max-sm:!rounded-none max-sm:h-full max-sm:max-h-full max-sm:!border-0"
 onKeyDown={(e) => {
 if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); handleApply() }
 }}
 >
 <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
 <div className="flex items-center gap-2.5">
 <DialogTitle>Layout Settings</DialogTitle>
 </div>
 </DialogHeader>

 <div className="px-6 py-5 space-y-5">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-medium text-foreground">Compact mode</p>
 <p className="text-xs text-muted-foreground">Reduce row height for denser layout</p>
 </div>
 <button onClick={() => setCompact((c) => !c)}
 className={`relative w-9 h-5 rounded-full transition-colors ${compact ? "bg-primary" : "bg-surface"}`}
 >
 <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-card transition-transform ${compact ? "translate-x-4" : "translate-x-0"}`} />
 </button>
 </div>

 <div className="pt-3 border-t border-border/40">
 <Button variant="outline" onClick={handleResetLayout} className="w-full">
 Reset to default layout
 </Button>
 </div>
 </div>

 <div className="px-6 pb-6 pt-3 border-t border-border/40 flex items-center justify-between">
 <span className="text-xs text-muted-foreground">{compact ? "Compact" : "Default"} layout</span>
 <Button onClick={handleApply} size="sm">
 Apply <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd>
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}

function WidgetPreferencesModal({ open, onOpenChange }: ModalProps) {
 const { visibleWidgets, addWidget, removeWidget } = useDashboardStore()
 const nonCoreWidgets = WIDGET_REGISTRY.filter((w) => w.category !== "core")
 const [enabled, setEnabled] = useState<Record<string, boolean>>({})

 const initEnabled = useCallback(() => {
 const initial: Record<string, boolean> = {}
 nonCoreWidgets.forEach((w) => { initial[w.id] = visibleWidgets.includes(w.id) })
 setEnabled(initial)
 }, [visibleWidgets, nonCoreWidgets])

 const handleOpenChange = useCallback((o: boolean) => {
 if (o) initEnabled()
 onOpenChange(o)
 }, [initEnabled, onOpenChange])

 const toggle = useCallback((id: string) => {
 setEnabled((prev) => {
 const next = !prev[id]
 if (next) addWidget(id)
 else removeWidget(id)
 return { ...prev, [id]: next }
 })
 }, [addWidget, removeWidget])

 const count = Object.values(enabled).filter(Boolean).length

 return (
 <Dialog open={open} onOpenChange={handleOpenChange}>
 <DialogContent
 className="sm:max-w-md !rounded-2xl !p-0 gap-0 overflow-hidden max-sm:!rounded-none max-sm:h-full max-sm:max-h-full max-sm:!border-0"
 onKeyDown={(e) => {
 if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); onOpenChange(false) }
 }}
 >
 <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
 <div className="flex items-center gap-2.5">
 <DialogTitle>Widget Preferences</DialogTitle>
 </div>
 </DialogHeader>

 <div className="px-6 py-5 max-h-80 overflow-y-auto">
 <div className="space-y-1">
 {nonCoreWidgets.map((w) => (
 <div key={w.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium text-foreground truncate">{w.title}</p>
 <p className="text-xs text-muted-foreground truncate capitalize">{w.category}</p>
 </div>
 <button onClick={() => toggle(w.id)}
 className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${enabled[w.id] ? "bg-primary" : "bg-surface"}`}
 >
 <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-card transition-transform ${enabled[w.id] ? "translate-x-4" : "translate-x-0"}`} />
 </button>
 </div>
 ))}
 </div>
 </div>

 <div className="px-6 pb-6 pt-3 border-t border-border/40 flex items-center justify-between">
 <span className="text-xs text-muted-foreground">{count} of {nonCoreWidgets.length} widgets visible</span>
 <Button onClick={() => onOpenChange(false)} size="sm">
 Done <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd>
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}

export {
 SyncToolModal, ExportPDFModal,
 ExportCSVModal, ShareModal, LayoutSettingsModal, WidgetPreferencesModal}
