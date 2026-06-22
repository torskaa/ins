"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

import { Clock, DollarSign, Hash, History, HouseIcon, Layers, Package, Pencil, ShoppingCart } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Frame, FramePanel } from "@/components/reui/frame"
import { formatCurrency, formatNumber, formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

function FieldDisplay({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
    </div>
  )
}

function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[11px] text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </p>
      {children}
    </div>
  )
}

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
  const [error, setError] = useState<string | null>(null)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [impact, setImpact] = useState<ImpactData | null>(null)
  const [loadingImpact, setLoadingImpact] = useState(false)
  const [productName, setProductName] = useState("")
  const [productSku, setProductSku] = useState("")
  const [productType, setProductType] = useState("")
  const [showEdit, setShowEdit] = useState(false)
  const [form, setForm] = useState<any>({})
  const [editingItem, setEditingItem] = useState<any>(null)
  const [saving, setSaving] = useState(false)

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
          setProductType(data[0].finishedGood.type)
        }
      })
      .catch((err) => { setError(err.message || "Failed to load data") })
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
          body: JSON.stringify({ action }),
        })
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

  async function handleSave() {
    if (!editingItem || !id) return
    setSaving(true)
    try {
      const res = await fetch(`/api/bom/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: parseFloat(form.quantity) || 0,
          scrapAllowance: parseFloat(form.scrapAllowance) || 0,
          unit: form.unit,
          wastePercent: parseFloat(form.wastePercent) || 0,
          notes: form.notes,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("BOM entry updated")
      setShowEdit(false)
      const refreshed = await fetch(`/api/bom?finishedGoodId=${id}`).then((r) => r.json())
      setLines(refreshed)
    } catch {
      toast.error("Failed to update BOM entry")
    } finally {
      setSaving(false)
    }
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load data"
        description={error}
        actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
      />
    )
  }

  if (loading) return <SkeletonDetail cards={3} hasChart={false} />

  if (lines.length === 0) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">BOM not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The bill of materials you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/bom")}>Back to BOM</Button>
      </div>
    )
  }

  const versionColumns = [
    { key: "version", label: "Version", render: (v: VersionGroup) => (
      <span className="font-mono font-medium">v{v.version}{v.version === versions[0]?.version && <span className="text-xs text-muted-foreground ml-1">(latest)</span>}</span>
    )},
    { key: "status", label: "Status", render: (v: VersionGroup) => <SemanticBadge semantic={v.status} category="status">{v.status}</SemanticBadge> },
    { key: "components", label: "Components", render: (v: VersionGroup) => <span className="font-mono">{v.items.length}</span> },
    { key: "totalQty", label: "Total Qty", render: (v: VersionGroup) => <span className="font-mono">{v.items.reduce((s, i) => s + i.quantity, 0)}</span> },
    { key: "createdAt", label: "Date", render: (v: VersionGroup) => <span className="text-sm text-muted-foreground">{formatDateTime(new Date(v.items[0]?.createdAt))}</span> },
    { key: "action", label: "", render: (v: VersionGroup) => (
      <Button variant="ghost" size="sm" onClick={() => setSelectedVersion(v.version)}>View</Button>
    )},
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/bom" className="flex items-center gap-1.5">
                  <HouseIcon className="size-4" aria-hidden="true" />
                  BOM
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{productName}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </FramePanel>
      </Frame>

      <div className="grid grid-cols-12 gap-4">
        {/* Page Header */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{productName}</h1>
                  {productType && (
                    <SemanticBadge semantic={productType} category="type" className="gap-1 text-[11px]"><Package className="w-3 h-3" />{productType}</SemanticBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {activeVersion && (
                    <SemanticBadge semantic={activeVersion.status} category="status" className="gap-1 text-[11px]"><BadgeDot />v{activeVersion.version} · {activeVersion.status}</SemanticBadge>
                  )}
                  <SemanticBadge semantic={productSku} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{productSku}</SemanticBadge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={loadImpact} loading={loadingImpact} className="gap-1.5 h-9">
                  Impact
                </Button>
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => { setEditingItem(activeVersion?.items[0] || null); if (activeVersion?.items[0]) { setForm({ quantity: String(activeVersion.items[0].quantity), scrapAllowance: String(activeVersion.items[0].scrapAllowance), unit: activeVersion.items[0].unit, wastePercent: String(activeVersion.items[0].wastePercent), notes: activeVersion.items[0].notes || "" }); setShowEdit(true) } } },
                ]} />
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
              {activeVersion && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated {formatDate(new Date(activeVersion.items[0]?.createdAt))}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* Components */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Layers className="w-4 h-4 text-primary" />
                Components ({activeVersion?.items.length || 0})
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs text-muted-foreground">Total quantity: {totalQty} units · Est. material cost: {formatCurrency(totalCost)}</p>
              <div className="hidden md:grid grid-cols-[1fr_80px_80px_80px_60px] gap-3 px-3 py-2 bg-muted/30 rounded-lg text-xs text-muted-foreground font-medium">
                <span>Component</span>
                <span>Qty</span>
                <span>Scrap</span>
                <span>Waste</span>
                <span>Unit</span>
              </div>
              {activeVersion?.items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_80px_60px] gap-3 items-center px-3 py-3 border-t border-border/50 hover:bg-muted/30 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
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
                  <div><Badge variant="outline" className="text-xs">{item.unit}</Badge></div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Impact Analysis */}
          {impact && (
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  Impact Analysis
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
                    <Package className="w-5 h-5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground font-medium">Affected Products</p>
                    <p className="text-2xl font-semibold font-mono">{impact.summary.uniqueProducts}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
                    <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground font-medium">Pending Orders</p>
                    <p className="text-2xl font-semibold font-mono">{impact.summary.pendingOrders}</p>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
                    <DollarSign className="w-5 h-5 text-muted-foreground" />
                    <p className="text-[11px] text-muted-foreground font-medium">Stock Value at Risk</p>
                    <p className="text-2xl font-semibold font-mono">{formatCurrency(impact.summary.totalStockValue)}</p>
                  </div>
                </div>
                {impact.affectedProducts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Products that use this component:</p>
                    <div className="space-y-1">
                      {impact.affectedProducts.map((p) => (
                        <div key={p.id} className="flex items-center justify-between text-sm p-2 rounded bg-muted/30">
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
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Workflow */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <History className="w-4 h-4 text-primary" />
                Workflow
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
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
                <Button variant="outline" onClick={() => handleAction("archive")} className="w-full gap-1.5">
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
                      <SemanticBadge semantic={activeVersion.status} category="status">{activeVersion.status}</SemanticBadge>
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

              <Button variant="outline" size="sm" onClick={() => router.push("/bom/new")} className="w-full gap-1.5">
                New Version
              </Button>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Version" value={activeVersion ? `v${activeVersion.version}` : "—"} />
              <FieldDisplay label="Status" value={activeVersion?.status || "—"} />
              <FieldDisplay label="Components" value={String(activeVersion?.items.length || 0)} />
              <FieldDisplay label="Total Qty" value={String(totalQty)} mono />
              <FieldDisplay label="Est. Cost" value={formatCurrency(totalCost)} mono />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Version History Tab Module */}
      {versions.length > 1 && (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
          <Tabs defaultValue="versions">
            <TabsList className="w-full overflow-x-auto px-4">
              <TabsTrigger value="versions" className="gap-1.5"><History className="w-4 h-4" /> Version History ({versions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="versions" className="pt-8 px-3 pb-3">
              <div data-slot="frame">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {versionColumns.map((col) => (
                        <TableHead key={col.key}>{col.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((v) => (
                      <TableRow key={v.version} className="cursor-pointer" onClick={() => setSelectedVersion(v.version)}>
                        {versionColumns.map((col) => (
                          <TableCell key={col.key}>
                            {col.render ? col.render(v) : String((v as any)[col.key] ?? "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-lg flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit BOM Entry</DialogTitle>
            <DialogDescription>Update component details for <span className="font-medium text-foreground">{editingItem?.material?.name || productName}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Layers className="w-4 h-4 text-primary" />
                  Component Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Quantity"><Input type="number" step="0.01" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Unit"><Input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Scrap Allowance"><Input type="number" step="0.01" value={form.scrapAllowance} onChange={(e) => setForm({ ...form, scrapAllowance: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Waste %"><Input type="number" step="0.1" value={form.wastePercent} onChange={(e) => setForm({ ...form, wastePercent: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Internal notes..." /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
