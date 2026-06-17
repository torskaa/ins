"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { History, Archive } from "lucide-react"
import { formatDateTime } from "@/lib/utils"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SkeletonDetail } from "@/components/ui/skeleton"

type BOMLine = {
 id: string
 finishedGood: { id: string; name: string; sku: string; type: string }
 material: { id: string; name: string; sku: string; type: string; unitPrice: number; uom: string }
 quantity: number
 scrapAllowance: number
 unit: string
 wastePercent: number
 version: number
 status: string
 effectiveDate: string | null
 expiryDate: string | null
 notes: string | null
 approvedBy: { id: string; name: string } | null
 approvedAt: string | null
 createdAt: string
}

type VersionGroup = {
 version: number
 status: string
 items: BOMLine[]
}

type ImpactData = {
 summary: { totalProducts: number; uniqueProducts: number; pendingOrders: number; totalStockValue: number }
 affectedProducts: { id: string; name: string; sku: string; quantity: number }[]
 affectedOrders: { id: string; number: string; status: string; quantity: number }[]
 totalStock: { id: string; name: string; stock: number; unitPrice: number }[]
}

const statusColors: Record<string, string> = {
 draft: "secondary",
 submitted: "warning",
 approved: "success",
 archived: "default"}

function groupByVersion(items: BOMLine[]): VersionGroup[] {
 const map = new Map<number, VersionGroup>()
 for (const item of items) {
 if (!map.has(item.version)) {
 map.set(item.version, { version: item.version, status: item.status, items: [] })
 }
 map.get(item.version)!.items.push(item)
 }
 return Array.from(map.values()).sort((a, b) => b.version - a.version)
}

export default function BOMDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const [id, setId] = useState("")
 const [lines, setLines] = useState<BOMLine[]>([])
 const [loading, setLoading] = useState(true)
 const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
 const [impact, setImpact] = useState<ImpactData | null>(null)
 const [loadingImpact, setLoadingImpact] = useState(false)
 const [showArchive, setShowArchive] = useState(false)
 const [archiving, setArchiving] = useState(false)
 const [productName, setProductName] = useState("")
 const [productSku, setProductSku] = useState("")

 useEffect(() => {
 params.then(({ id }) => setId(id))
 }, [params])

 useEffect(() => {
 if (!id) return
 fetch(`/api/bom?finishedGoodId=${id}`)
 .then((r) => r.json())
 .then((data: BOMLine[]) => {
 setLines(data)
 const versions = groupByVersion(data)
 if (versions.length > 0) setSelectedVersion(versions[0].version)
 if (data.length > 0) {
 setProductName(data[0].finishedGood.name)
 setProductSku(data[0].finishedGood.sku)
 }
 })
 .finally(() => setLoading(false))
 }, [id])

 const versions = groupByVersion(lines)
 const activeVersion = versions.find((v) => v.version === selectedVersion) || versions[0]
 const isLatest = activeVersion?.version === versions[0]?.version

 async function handleAction(action: string, version?: number) {
 const targetVersion = version || activeVersion?.version
 if (!targetVersion) return
 const targetItems = lines.filter((l) => l.version === targetVersion)
 if (targetItems.length === 0) return

 try {
 for (const item of targetItems) {
 const res = await fetch(`/api/bom/${item.id}/approve`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ action })})
 if (!res.ok) {
 const err = await res.json()
 throw new Error(err.error || `Failed to ${action}`)
 }
 }
 const newStatus = action === "approve" ? "approved" : action === "submit" ? "submitted" : action === "archive" ? "archived" : "draft"
 toast.success(`v${targetVersion} ${newStatus}`)

 const refreshed = await fetch(`/api/bom?finishedGoodId=${id}`).then((r) => r.json())
 setLines(refreshed)
 } catch (err: any) {
 toast.error(err.message)
 }
 }

 async function loadImpact() {
 if (!activeVersion?.items[0]) return
 setLoadingImpact(true)
 try {
 const res = await fetch(`/api/bom/${activeVersion.items[0].id}/impact`)
 if (res.ok) setImpact(await res.json())
 } catch {
 toast.error("Failed to load impact analysis")
 } finally {
 setLoadingImpact(false)
 }
 }

 const totalQty = activeVersion?.items.reduce((s, i) => s + i.quantity, 0) || 0
 const totalCost = activeVersion?.items.reduce((s, i) => s + i.quantity * i.material.unitPrice, 0) || 0

 if (loading) return <SkeletonDetail cards={3} hasChart={false} />

 if (lines.length === 0) {
 return (
 <div className="animate-fade-in">
 <p>BOM not found</p>
 <Button variant="secondary" onClick={() => router.push("/bom")}>Back to BOM</Button>
 </div>
 )
 }

 return (
 <div className="animate-fade-in">
 <button
 onClick={() => router.push("/bom")}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
 >
 Back to BOM
 </button>

 <div className="page-header flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2">
 <h1>{productName}</h1>
 {activeVersion && (
 <Badge variant={(statusColors[activeVersion.status] || "secondary") as any}>
 v{activeVersion.version} · {activeVersion.status}
 </Badge>
 )}
 </div>
 <p className="text-muted-foreground font-mono text-sm">{productSku}</p>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="secondary" size="sm" onClick={() => router.push(`/bom/${id}/edit`)} className="gap-1.5">
 Edit
 </Button>
 <Button variant="secondary" size="sm" onClick={loadImpact} loading={loadingImpact} className="gap-1.5">
 Impact
 </Button>
 {versions.length > 1 && (
 <select
 value={selectedVersion || versions[0]?.version}
 onChange={(e) => setSelectedVersion(Number(e.target.value))}
 className="text-xs border border-border rounded-lg px-2 py-1.5 bg-background"
 >
 {versions.map((v) => (
 <option key={v.version} value={v.version}>v{v.version} ({v.status})</option>
 ))}
 </select>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <Card>
 <CardHeader>
 <CardTitle>Components ({activeVersion?.items.length || 0})</CardTitle>
 <CardDescription>Total quantity: {totalQty} units · Est. material cost: {new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(totalCost)}</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_60px] gap-3 px-3 py-2 bg-surface/30 rounded-lg text-xs text-muted-foreground font-medium mb-1">
 <span>Component</span>
 <span>Qty</span>
 <span>Scrap</span>
 <span>Waste</span>
 <span>Unit</span>
 </div>
 {activeVersion?.items.map((item) => (
 <div
 key={item.id}
 className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_80px_60px] gap-3 items-center px-3 py-3 border-t border-border/50 hover:bg-surface/30 transition-colors rounded-lg"
 >
 <div className="flex items-center gap-2">
 null
 <div>
 <p className="text-sm font-medium">{item.material.name}</p>
 <p className="text-xs text-muted-foreground font-mono">{item.material.sku}</p>
 </div>
 </div>
 <div><span className="font-mono text-sm">{item.quantity}</span></div>
 <div><span className="font-mono text-xs text-muted-foreground">{item.scrapAllowance > 0 ? item.scrapAllowance : "—"}</span></div>
 <div>
 {item.wastePercent > 0 ? (
 <span className="font-mono text-xs text-destructive">{item.wastePercent}%</span>
 ) : (
 <span className="text-xs text-muted-foreground">—</span>
 )}
 </div>
 <div><Badge variant="secondary" className="text-xs">{item.unit}</Badge></div>
 </div>
 ))}
 </CardContent>
 </Card>

 {impact && (
 <Card>
 <CardHeader>
 <CardTitle>Impact Analysis</CardTitle>
 <CardDescription>What happens if you change materials in this BOM</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="grid grid-cols-3 gap-4">
 <div className="p-3 rounded-lg bg-surface/50">
 <p className="text-xs text-muted-foreground">Affected Products</p>
 <p className="text-2xl font-semibold font-mono">{impact.summary.uniqueProducts}</p>
 </div>
 <div className="p-3 rounded-lg bg-surface/50">
 <p className="text-xs text-muted-foreground">Pending Orders</p>
 <p className="text-2xl font-semibold font-mono">{impact.summary.pendingOrders}</p>
 </div>
 <div className="p-3 rounded-lg bg-surface/50">
 <p className="text-xs text-muted-foreground">Stock Value at Risk</p>
 <p className="text-2xl font-semibold font-mono">{new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(impact.summary.totalStockValue)}</p>
 </div>
 </div>
 {impact.affectedProducts.length > 0 && (
 <div>
 <p className="text-sm font-medium mb-2">Products that use this component:</p>
 <div className="space-y-1">
 {impact.affectedProducts.map((p) => (
 <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded bg-surface/30">
 <span>{p.name} ({p.sku})</span>
 <span className="font-mono text-xs">{p.quantity} per unit</span>
 </div>
 ))}
 </div>
 </div>
 )}
 </CardContent>
 </Card>
 )}

 {versions.length > 1 && (
 <Card>
 <CardHeader>
 <CardTitle>Version History</CardTitle>
 <CardDescription>{versions.length} versions of this BOM</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {versions.map((v, i) => (
 <div key={v.version} className="flex items-center justify-between p-3 rounded-lg bg-surface/50">
 <div className="flex items-center gap-3">
 <History className="w-4 h-4 text-muted-foreground" />
 <div>
 <p className="text-sm font-medium">
 v{v.version}
 {i === 0 && <span className="text-xs text-muted-foreground ml-1">(latest)</span>}
 </p>
 <p className="text-xs text-muted-foreground">
 {v.items.length} components · {formatDateTime(new Date(v.items[0]?.createdAt))}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Badge variant={(statusColors[v.status] || "secondary") as any}>{v.status}</Badge>
 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedVersion(v.version)}>
 </Button>
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}
 </div>

 <div className="space-y-6">
 <Card>
 <CardHeader>
 <CardTitle>Workflow</CardTitle>
 </CardHeader>
 <CardContent className="space-y-3">
 {activeVersion?.status === "draft" && (
 <Button onClick={() => handleAction("submit")} className="w-full gap-1.5">
 Submit for Approval
 </Button>
 )}
 {activeVersion?.status === "submitted" && (
 <Button onClick={() => handleAction("approve")} className="w-full gap-1.5" variant="default">
 Approve
 </Button>
 )}
 {isLatest && activeVersion?.status === "approved" && (
 <Button variant="secondary" onClick={() => handleAction("archive")} className="w-full gap-1.5">
 Archive
 </Button>
 )}
 {!isLatest && (
 <p className="text-xs text-muted-foreground text-center">Select latest version to manage workflow</p>
 )}

 <Separator />

 <div className="space-y-2">
 {activeVersion && (
 <>
 <div className="flex justify-between text-xs">
 <span className="text-muted-foreground">Status</span>
 <Badge variant={(statusColors[activeVersion.status] || "secondary") as any}>{activeVersion.status}</Badge>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-muted-foreground">Version</span>
 <span className="font-mono">{activeVersion.version}</span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-muted-foreground">Components</span>
 <span>{activeVersion.items.length}</span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-muted-foreground">Total Qty</span>
 <span className="font-mono">{totalQty}</span>
 </div>
 </>
 )}
 </div>

 <Separator />

 <Button variant="secondary" size="sm" onClick={() => router.push("/bom/new")} className="w-full gap-1.5">
 New Version
 </Button>
 </CardContent>
 </Card>
 </div>
 </div>

 <ConfirmDialog
 open={showArchive}
 onOpenChange={setShowArchive}
 title="Archive BOM"
 description="Are you sure you want to archive this BOM version? It will no longer be active for production."
 onConfirm={() => handleAction("archive")}
 loading={archiving}
 />
 </div>
 )
}
