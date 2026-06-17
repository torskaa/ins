"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { toast } from "sonner"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { SkeletonTable } from "@/components/ui/skeleton"

type BOMItem = {
 id: string
 finishedGood: { id: string; name: string; sku: string }
 material: { id: string; name: string; sku: string; type: string }
 quantity: number
 scrapAllowance: number
 unit: string
 wastePercent: number
 version: number
 status: string
 effectiveDate: string | null
 createdAt: string
}

type VersionGroup = {
 version: number
 status: string
 items: BOMItem[]
}

type BOMGroup = {
 finishedGoodId: string
 finishedGoodName: string
 finishedGoodSku: string
 versions: VersionGroup[]
}

const statusColors: Record<string, string> = {
 draft: "secondary",
 submitted: "warning",
 approved: "success",
 archived: "default"}

function groupBOMs(boms: BOMItem[]): BOMGroup[] {
 const fgMap = new Map<string, BOMGroup>()
 for (const b of boms) {
 const fgKey = b.finishedGood.id
 if (!fgMap.has(fgKey)) {
 fgMap.set(fgKey, { finishedGoodId: fgKey, finishedGoodName: b.finishedGood.name, finishedGoodSku: b.finishedGood.sku, versions: [] })
 }
 const group = fgMap.get(fgKey)!
 let vg = group.versions.find((v) => v.version === b.version)
 if (!vg) {
 vg = { version: b.version, status: b.status, items: [] }
 group.versions.push(vg)
 }
 vg.items.push(b)
 }
 for (const group of fgMap.values()) {
 group.versions.sort((a, b) => b.version - a.version)
 }
 return Array.from(fgMap.values()).sort((a, b) => a.finishedGoodName.localeCompare(b.finishedGoodName))
}

export default function BOMPage() {
 const [boms, setBoms] = useState<BOMItem[]>([])
 const [loading, setLoading] = useState(true)
 const [deleteId, setDeleteId] = useState<string | null>(null)
 const [deleting, setDeleting] = useState(false)
 const [expandedVersion, setExpandedVersion] = useState<Map<string, number>>(new Map())
 const router = useRouter()
 const handleNew = useCallback(() => router.push("/bom/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/bom")
 .then((res) => res.json())
 .then((data) => {
 const list = Array.isArray(data) ? data : []
 setBoms(list)
 const groups = groupBOMs(list)
 const exp = new Map<string, number>()
 for (const g of groups) {
 if (g.versions.length > 0) exp.set(g.finishedGoodId, g.versions[0].version)
 }
 setExpandedVersion(exp)
 })
 .finally(() => setLoading(false))
 }, [])

 async function handleDelete() {
 if (!deleteId) return
 setDeleting(true)
 try {
 const res = await fetch(`/api/bom/${deleteId}`, { method: "DELETE" })
 if (!res.ok) {
 const err = await res.json()
 throw new Error(err.error || "Failed to delete")
 }
 setBoms((prev) => prev.filter((b) => b.id !== deleteId))
 toast.success("BOM entry deleted")
 } catch (err: any) {
 toast.error(err.message)
 } finally {
 setDeleting(false)
 setDeleteId(null)
 }
 }

 const groups = groupBOMs(boms)
 const totalMaterials = boms.length
 const totalGroups = groups.length
 const latest = groups.filter((g) => g.versions[0]?.status === "approved")
 const draft = groups.filter((g) => g.versions[0]?.status === "draft")

 if (!loading && boms.length === 0) {
 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Bill of Materials</h1>
 <p>Manufacturing engine — define, version, and approve production recipes</p>
 </div>
 <MoreMenu actions={[
 { label: "Import", icon: ActionIcons.AddNew },
 "separator",
 { label: "Export CSV", icon: ActionIcons.ExportCSV },
 { label: "Export PDF", icon: ActionIcons.ExportPDF },
 ]} />
 </div>
 <Card>
 <CardContent className="p-8">
 <EmptyState
 icons={[, ]}
 title="No BOMs yet"
 description="Create your first bill of materials to link finished goods with raw materials"
 actions={[{ label: "New BOM", onClick: () => router.push("/bom/new") }]}
 />
 </CardContent>
 </Card>
 </div>
 )
 }

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Bill of Materials</h1>
 <p>
 {totalGroups} finished goods · {totalMaterials} material links ·
 <span className="text-success ml-1">{latest.length} approved</span>
 <span className="text-warning ml-1"> · {draft.length} draft</span>
 </p>
 </div>
 <Button onClick={handleNew} className="gap-1.5">New BOM <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>

 {loading ? (
 <SkeletonTable rows={5} columns={4} />
 ) : (
 <div className="space-y-4">
 {groups.map((group) => {
 const activeVersion = expandedVersion.get(group.finishedGoodId) || group.versions[0]?.version
 const activeVg = group.versions.find((v) => v.version === activeVersion)
 return (
 <Card key={group.finishedGoodId} className="overflow-hidden">
 <div className="p-4 border-b border-border bg-surface/20">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
 </div>
 <div>
 <button
 onClick={() => router.push(`/bom/${group.finishedGoodId}`)}
 className="font-medium text-sm hover:text-primary transition-colors text-left"
 >
 {group.finishedGoodName}
 </button>
 <p className="text-xs text-muted-foreground font-mono">{group.finishedGoodSku}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 {group.versions.length > 1 && (
 <select
 value={activeVersion}
 onChange={(e) => {
 const m = new Map(expandedVersion)
 m.set(group.finishedGoodId, Number(e.target.value))
 setExpandedVersion(m)
 }}
 className="text-xs border border-border rounded-md px-2 py-1 bg-background"
 >
 {group.versions.map((v) => (
 <option key={v.version} value={v.version}>v{v.version}</option>
 ))}
 </select>
 )}
 {activeVg && (
 <Badge variant={(statusColors[activeVg.status] || "secondary") as any}>
 v{activeVg.version} · {activeVg.status}
 </Badge>
 )}
 <span className="text-xs text-muted-foreground">{activeVg?.items.length || 0} items</span>
 </div>
 </div>
 </div>

 {activeVg && (
 <div>
 <div className="hidden md:grid grid-cols-[1fr_80px_100px_80px_80px_60px] gap-3 px-4 py-2 bg-surface/30 text-xs text-muted-foreground font-medium">
 <span>Component</span>
 <span>Qty</span>
 <span>Unit</span>
 <span>Scrap</span>
 <span>Waste %</span>
 <span></span>
 </div>
 {activeVg.items.map((item) => (
 <div
 key={item.id}
 className="grid grid-cols-1 md:grid-cols-[1fr_80px_100px_80px_80px_60px] gap-3 items-center px-4 py-3 border-t border-border/50 hover:bg-surface/30 transition-colors"
 >
 <div className="flex items-center gap-2">
 null
 <div>
 <p className="text-sm font-medium">{item.material.name}</p>
 <p className="text-xs text-muted-foreground font-mono">{item.material.sku}</p>
 </div>
 </div>
 <div><span className="font-mono text-sm">{item.quantity}</span></div>
 <div><Badge variant="secondary" className="text-xs">{item.unit}</Badge></div>
 <div><span className="font-mono text-xs">{item.scrapAllowance > 0 ? item.scrapAllowance : "—"}</span></div>
 <div>
 {item.wastePercent > 0 ? (
 <span className="font-mono text-sm text-destructive">{item.wastePercent}%</span>
 ) : (
 <span className="text-xs text-muted-foreground">—</span>
 )}
 </div>
 <div className="flex justify-end gap-1">
 <Button
 variant="ghost"
 size="icon"
 className="text-muted-foreground hover:text-primary h-7 w-7"
 onClick={() => router.push(`/materials/${item.material.id}`)}
 >
 </Button>
 <Button
 variant="ghost"
 size="icon"
 className="text-muted-foreground hover:text-destructive h-7 w-7"
 onClick={(e) => { e.stopPropagation(); setDeleteId(item.id) }}
 >
 </Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </Card>
 )
 })}
 </div>
 )}

 <ConfirmDialog
 open={!!deleteId}
 onOpenChange={(open) => { if (!open) setDeleteId(null) }}
 title="Delete BOM Entry"
 description="Are you sure you want to delete this material from the BOM? This action cannot be undone."
 onConfirm={handleDelete}
 loading={deleting}
 />
 </div>
 )
}
