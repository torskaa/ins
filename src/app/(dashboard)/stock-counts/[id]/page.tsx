"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { ArrowLeft, ClipboardList, Calculator, Trash2, AlertTriangle, FileText, Barcode, Sparkles, CheckCircle, Edit, Building2, Hash, CalendarDays, MoreHorizontal } from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { format } from "date-fns"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

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

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700"}

export default function StockCountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [stockCount, setStockCount] = useState<StockCountDetail | null>(null)
  const [items, setItems] = useState<StockCountItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
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
    .then((data) => {
      setStockCount(data)
      setItems(data.items.map((i: StockCountItem) => ({ ...i })))
    })
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

  if (loading) return <SkeletonDetail cards={4} hasChart={true} />

  if (!stockCount) return (
    <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
      <p className="text-lg font-medium text-muted-foreground mb-2">Stock count not found</p>
      <Button variant="link" className="text-sm" onClick={() => router.push("/stock-counts")}>
        Back to Stock Counts
      </Button>
    </div>
  )

  const matchedItems = items.filter(i => i.difference === 0).length
  const discrepancyItems = items.filter(i => i.difference !== 0).length
  const discrepancies = items.filter((i) => i.difference !== 0)

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 px-6 pt-6 pb-3 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <Breadcrumb className="mb-2">
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
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-lg font-semibold font-mono">{stockCount.number}</h1>
              <Badge className={`${statusColors[stockCount.status] || ""} border-0 font-medium text-[10px]`}>
                {stockCount.status.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <Building2 className="w-3 h-3" />{stockCount.warehouse.name}
              {stockCount.warehouse.location && <><span className="text-muted-foreground/50">·</span>{stockCount.warehouse.location}</>}
              <span className="text-muted-foreground/50">·</span>
              <CalendarDays className="w-3 h-3" />{format(new Date(stockCount.countDate), "dd/MM/yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {stockCount.status !== "completed" && (
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => router.push(`/stock-counts/${stockCount.id}/edit`)}>
                <Edit className="w-3.5 h-3.5" /> Edit
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreHorizontal className="w-3.5 h-3.5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive"><Trash2 className="w-3.5 h-3.5 mr-2" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Left Column — Count Sheet (8 cols) */}
        <div className="col-span-8 flex flex-col gap-4">
          <Card className="border-border/50">
            <CardHeader className="px-4 pt-4 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-primary" />
                Count Sheet
                <span className="text-xs text-muted-foreground font-normal ml-auto">
                  {matchedItems} matched · {discrepancyItems} discrepancy{discrepancyItems !== 1 ? "ies" : "y"}
                </span>
              </CardTitle>
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
                <Button variant="secondary" size="sm" className="gap-1.5 h-9 text-xs" onClick={handleAiCount} disabled={aiCounting}>
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
                              ? "bg-yellow-50 border-yellow-300 ring-1 ring-yellow-300"
                              : item.difference !== 0
                                ? "bg-red-50/50"
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
                                className="w-16 text-right font-mono text-xs px-1.5 py-0.5 rounded border border-blue-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                                autoFocus
                              />
                            ) : (
                              <span className="font-mono text-xs cursor-pointer hover:bg-blue-50 px-1.5 py-0.5 rounded" onClick={e => { e.stopPropagation(); focusEditingQty(item.id) }}>
                                {item.actualQty}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-xs">
                            <span className={item.difference !== 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>
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

        {/* Right Column — Summary + Notes + Discrepancies (4 cols) */}
        <div className="col-span-4 flex flex-col gap-4">
          <Card className="border-border/50">
            <CardHeader className="px-4 pt-4 pb-0">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge className={`${statusColors[stockCount.status] || ""} border-0 font-medium text-[10px]`}>
                  {stockCount.status.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Count Date</span>
                <span className="text-xs font-medium">{format(new Date(stockCount.countDate), "dd/MM/yyyy")}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Total Items</span>
                <span className="text-xs font-mono font-medium">{items.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Matched</span>
                <span className="text-xs font-mono font-medium text-emerald-600">{matchedItems}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Discrepancies</span>
                <span className={`text-xs font-mono font-medium ${discrepancyItems > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                  {discrepancyItems}
                </span>
              </div>
            </CardContent>
          </Card>

          {stockCount.notes && (
            <Card className="border-border/50">
              <CardContent className="p-3.5">
                <p className="text-[11px] text-muted-foreground font-medium mb-1">Notes</p>
                <p className="text-xs">{stockCount.notes}</p>
              </CardContent>
            </Card>
          )}

          <Card className={`border-border/50 flex-1 ${discrepancies.length > 0 ? "border-red-200/50" : ""}`}>
            <CardHeader className="px-4 pt-4 pb-0">
              <CardTitle className={`text-xs flex items-center gap-2 ${discrepancies.length > 0 ? "text-red-700" : "text-emerald-700"}`}>
                {discrepancies.length > 0 ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Discrepancies ({discrepancies.length})
              </CardTitle>
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
                        <p className={`text-[11px] font-semibold font-mono ${item.difference < 0 ? "text-red-600" : "text-amber-600"}`}>
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
        </div>
      </div>

      <ConfirmDialog open={deleteOpen} onOpenChange={setDeleteOpen} title="Delete Stock Count" description={`Are you sure you want to delete stock count "${stockCount.number}"? This action cannot be undone.`} onConfirm={handleDelete} loading={deleting} />
    </div>
  )
}
