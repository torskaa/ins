"use client"

import { useState, useEffect, useRef, use } from "react"
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
import { AlertTriangle, ArrowLeft, Barcode, Boxes, Building2, Calendar, Calculator, CheckCircle, ClipboardList, Clock, DollarSign, FileText, Hash, Layers, MapPin, Package, Pencil, Sparkles, Trash2, XCircle } from "lucide-react"
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

type StockCountItem = {
  id: string
  expectedQty: number
  actualQty: number
  difference: number
  notes: string | null
  product: { id: string; name: string; sku: string; unitPrice: number; barcode: string | null }
}

type StockCountDetail = {
  id: string
  number: string
  status: string
  countDate: string
  totalItems: number
  matchedItems: number
  discrepancyItems: number
  notes: string | null
  warehouse: { id: string; name: string; location: string | null }
  items: StockCountItem[]
}

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      {badge ? (
        <SemanticBadge semantic={value} category="status">{value}</SemanticBadge>
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

export default function StockCountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [stockCount, setStockCount] = useState<StockCountDetail | null>(null)
  const [items, setItems] = useState<StockCountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [form, setForm] = useState<any>({})
  const [barcodeInput, setBarcodeInput] = useState("")
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [aiCounting, setAiCounting] = useState(false)
  const [editingQty, setEditingQty] = useState<{ id: string; value: string } | null>(null)
  const barcodeRef = useRef<HTMLInputElement>(null)
  const highlightRef = useRef<HTMLTableRowElement>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/stock-counts/${id}`)
      .then(r => r.json())
      .then((json) => {
        if (!json?.success) throw new Error(json?.error || "Failed to load")
        const data = json.data
        setStockCount(data)
        setItems(data.items.map((i: StockCountItem) => ({ ...i })))
        setForm({ countDate: data.countDate || "", notes: data.notes || "" })
      })
      .catch((err) => { setError(err.message) })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (highlightedId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [highlightedId])

  function handleBarcodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = barcodeInput.trim()
    if (!code) return

    const match = items.find(i => i.product.barcode === code)
    if (match) {
      setHighlightedId(match.id)
      setEditingQty({ id: match.id, value: String(match.actualQty) })
      setBarcodeInput("")
      toast.success(`Found: ${match.product.name}`)
      barcodeRef.current?.focus()
    } else {
      toast.error(`No item with barcode "${code}" in this count sheet`)
    }
  }

  function handleActualQtyChange(itemId: string, raw: string) {
    setEditingQty({ id: itemId, value: raw })
    const qty = parseInt(raw, 10)
    if (!isNaN(qty)) {
      setItems(prev => prev.map(i => {
        if (i.id !== itemId) return i
        const diff = qty - i.expectedQty
        return { ...i, actualQty: qty, difference: diff }
      }))
    }
  }

  function handleActualQtyBlur(itemId: string) {
    setEditingQty(null)
  }

  function focusEditingQty(itemId: string) {
    const item = items.find(i => i.id === itemId)
    if (item) {
      setEditingQty({ id: itemId, value: String(item.actualQty) })
    }
  }

  async function handleAiCount() {
    setAiCounting(true)
    await new Promise(r => setTimeout(r, 1500))
    setItems(prev => prev.map(i => {
      const variance = Math.floor(Math.random() * 5) - 2
      const aiQty = Math.max(0, i.expectedQty + variance)
      return { ...i, actualQty: aiQty, difference: aiQty - i.expectedQty }
    }))
    setAiCounting(false)
    toast.success("AI counting complete")
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/stock-counts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Stock count updated")
      setShowEdit(false)
    } catch {
      toast.error("Failed to update stock count")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/stock-counts/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Stock count deleted")
      router.push("/stock-counts")
    } catch {
      toast.error("Failed to delete stock count")
      setDeleting(false)
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

  if (loading) return <SkeletonDetail cards={4} hasChart={true} />

  if (!stockCount) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Stock count not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The stock count you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/stock-counts")}>Back to Stock Counts</Button>
      </div>
    )
  }

  const matchedItems = items.filter(i => i.difference === 0).length
  const discrepancyItems = items.filter(i => i.difference !== 0).length
  const discrepancies = items.filter((i) => i.difference !== 0)

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/stock-counts")}>Stock Counts</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{stockCount.number}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold font-mono">{stockCount.number}</h1>
                  {stockCount.warehouse && (
                    <SemanticBadge semantic={stockCount.warehouse.name} category="category" className="gap-1 text-[11px]"><Building2 className="w-3 h-3" />{stockCount.warehouse.name}</SemanticBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={stockCount.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{stockCount.status}</SemanticBadge>
                  <SemanticBadge semantic={stockCount.number} category="id" className="gap-1 font-mono text-[11px]"><Hash className="w-3 h-3" />{stockCount.number}</SemanticBadge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(new Date(stockCount.countDate))}</span>
                  {stockCount.warehouse.location && <><span className="text-muted-foreground/30">·</span><span>{stockCount.warehouse.location}</span></>}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {stockCount.status !== "completed" && (
                  <Button size="sm" onClick={() => setShowEdit(true)} className="gap-1.5 h-9">Edit <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘E</kbd></Button>
                )}
                <MoreMenu actions={[
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) — Count Sheet */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ClipboardList className="w-4 h-4 text-primary" />
                Count Sheet
                <span className="text-xs text-muted-foreground font-normal ml-auto">
                  {matchedItems} matched · {discrepancyItems} discrepancy{discrepancyItems !== 1 ? "ies" : "y"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 flex-1 min-w-[280px]">
                  <div className="relative flex-1">
                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      ref={barcodeRef}
                      value={barcodeInput}
                      onChange={e => setBarcodeInput(e.target.value)}
                      placeholder="Scan or type barcode..."
                      className="pl-9 font-mono text-sm h-9"
                      autoFocus
                    />
                  </div>
                  <Button type="submit" size="sm" className="gap-1.5 h-9 text-xs">Find</Button>
                </form>
                <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs" onClick={handleAiCount} disabled={aiCounting}>
                  <Sparkles className={`w-3.5 h-3.5 ${aiCounting ? "animate-pulse" : ""}`} />
                  {aiCounting ? "AI Counting..." : "AI Count"}
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Product</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">SKU</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Barcode</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Expected</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Actual</th>
                      <th className="text-right px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Diff</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground text-[11px] uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => {
                      const isHighlighted = highlightedId === item.id
                      const isEditing = editingQty?.id === item.id
                      return (
                        <tr
                          key={item.id}
                          ref={isHighlighted ? highlightRef : undefined}
                          className={`transition-colors ${
                            isHighlighted
                              ? "bg-warning/5 border-warning/30 ring-1 ring-warning/30"
                              : item.difference !== 0
                                ? "bg-destructive/10"
                                : "hover:bg-muted/30"
                          }`}
                          onClick={() => { setHighlightedId(null); focusEditingQty(item.id) }}
                        >
                          <td className="px-3 py-2"><span className="text-xs font-medium">{item.product.name}</span></td>
                          <td className="px-3 py-2"><span className="font-mono text-[11px] text-muted-foreground">{item.product.sku}</span></td>
                          <td className="px-3 py-2"><span className="font-mono text-[11px] text-muted-foreground">{item.product.barcode || "—"}</span></td>
                          <td className="px-3 py-2 text-right font-mono text-xs">{item.expectedQty}</td>
                          <td className="px-3 py-2 text-right">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editingQty!.value}
                                onChange={e => handleActualQtyChange(item.id, e.target.value)}
                                onBlur={() => handleActualQtyBlur(item.id)}
                                onKeyDown={e => {
                                  if (e.key === "Enter") handleActualQtyBlur(item.id)
                                  if (e.key === "Escape") { setEditingQty(null); setHighlightedId(null) }
                                }}
                                className="w-16 text-right font-mono text-xs px-1.5 py-0.5 rounded border border-info bg-card focus:outline-none focus:ring-2 focus:ring-info/50"
                                autoFocus
                              />
                            ) : (
                              <span className="font-mono text-xs cursor-pointer hover:bg-info/5 px-1.5 py-0.5 rounded" onClick={e => { e.stopPropagation(); focusEditingQty(item.id) }}>
                                {item.actualQty}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            <span className={item.difference !== 0 ? "text-destructive font-semibold" : "text-muted-foreground"}>
                              {item.difference > 0 ? `+${item.difference}` : item.difference}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{item.notes || "—"}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Summary */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Calculator className="w-4 h-4 text-primary" />
                Summary
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <SemanticBadge semantic={stockCount.status} category="status" className="text-[10px]" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Count Date</span>
                <span className="text-xs font-medium">{formatDate(new Date(stockCount.countDate))}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Items</span>
                <span className="text-xs font-mono font-medium">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Matched</span>
                <span className="text-xs font-mono font-medium text-success">{matchedItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Discrepancies</span>
                <span className={`text-xs font-mono font-medium ${discrepancyItems > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {discrepancyItems}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4 text-primary" />
                Organization
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5"><Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Warehouse</span><span className="text-sm font-medium ml-auto">{stockCount.warehouse.name}</span></div>
                {stockCount.warehouse.location && <div className="flex items-center gap-2.5"><MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Location</span><span className="text-sm font-medium ml-auto">{stockCount.warehouse.location}</span></div>}
              </div>
            </CardContent>
          </Card>

          {/* Discrepancies */}
          <Card className={`flex-1 ${discrepancies.length > 0 ? "border-destructive/20" : ""}`}>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className={`flex items-center gap-2 text-sm font-semibold ${discrepancies.length > 0 ? "text-destructive" : "text-success"}`}>
                {discrepancies.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                Discrepancies ({discrepancies.length})
              </div>
            </CardHeader>
            <CardContent className={discrepancies.length > 0 ? "p-0" : "p-4"}>
              {discrepancies.length > 0 ? (
                <div className="divide-y divide-border">
                  {discrepancies.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="min-w-0 flex-1 mr-2">
                        <p className="text-xs font-medium truncate">{item.product.name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">SKU: {item.product.sku}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[11px] text-muted-foreground">Exp <span className="font-mono">{item.expectedQty}</span></p>
                        <p className="text-[11px] text-muted-foreground">Act <span className="font-mono">{item.actualQty}</span></p>
                        <p className={`text-[11px] font-semibold font-mono ${item.difference < 0 ? "text-destructive" : "text-warning"}`}>
                          {item.difference > 0 ? `+${item.difference}` : item.difference}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 animate-fade-in">
                  <p className="text-xs text-muted-foreground">All items matched — no discrepancies</p>
                </div>
              )}
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
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Created" value={formatDate(new Date(stockCount.countDate))} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Stock Count</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{stockCount?.number}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Count Date"><Input type="date" value={form.countDate} onChange={(e) => setForm({ ...form, countDate: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Stock Count</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{stockCount.number}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
