"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { use } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
 ArrowLeft, ClipboardList, Calculator, Trash2,
 AlertTriangle, FileText, Barcode, Sparkles, Scan, CheckCircle, Edit} from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { format } from "date-fns"
import { SkeletonDetail } from "@/components/ui/skeleton"

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
 // Simulate AI counting delay
 await new Promise(r => setTimeout(r, 1500))
 setItems(prev => prev.map(i => {
 const variance = Math.floor(Math.random() * 5) - 2 // -2 to +2
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

 const summaryCards = [
 { label: "Status", value: stockCount.status.replace(/_/g, " "), icon: ClipboardList, color: "text-blue-600 bg-blue-100" },
 { label: "Count Date", value: format(new Date(stockCount.countDate), "dd/MM/yyyy"), icon: Calculator, color: "text-violet-600 bg-violet-100" },
 { label: "Total Items", value: items.length, icon: FileText, color: "text-amber-600 bg-amber-100" },
 { label: "Discrepancies", value: discrepancyItems, icon: AlertTriangle, color: discrepancyItems > 0 ? "text-red-600 bg-red-100" : "text-emerald-600 bg-emerald-100" },
 ]

 const discrepancies = items.filter((i) => i.difference !== 0)

 return (
 <div className="animate-fade-in space-y-6">
 <button
 onClick={() => router.push("/stock-counts")}
 className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
 >
 Back to Stock Counts
 </button>

 <div className="flex items-start justify-between">
 <div className="flex items-start gap-4">
 <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
 </div>
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h1 className="text-2xl font-semibold font-mono">{stockCount.number}</h1>
 <Badge className={`${statusColors[stockCount.status] || ""} border-0 font-medium`}>
 {stockCount.status.replace(/_/g, " ")}
 </Badge>
 </div>
 <p className="text-sm text-muted-foreground">
 {stockCount.warehouse.name}
 {stockCount.warehouse.location && ` · ${stockCount.warehouse.location}`}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push(`/stock-counts/${stockCount.id}/edit`)}>
 Edit
 </Button>
 <Button variant="secondary" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
 Delete
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {summaryCards.map((card) => (
 <Card key={card.label} className="border-border/50">
 <CardContent className="p-4">
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
 <card.icon className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider truncate">
 {card.label}
 </p>
 <p className="text-sm font-semibold font-mono mt-0.5 truncate">{card.value}</p>
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 </div>

 {stockCount.notes && (
 <Card>
 <CardContent className="p-4">
 <p className="text-xs text-muted-foreground mb-1">Notes</p>
 <p className="text-sm">{stockCount.notes}</p>
 </CardContent>
 </Card>
 )}

 <Card>
 <CardHeader>
 <CardTitle className="text-base flex items-center gap-2">
 Count Sheet
 <span className="text-xs text-muted-foreground font-normal ml-auto">
 {matchedItems} matched · {discrepancyItems} discrepancies
 </span>
 </CardTitle>
 </CardHeader>
 <CardContent className="p-4 space-y-4">
 <div className="flex items-center gap-3 flex-wrap">
 <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 flex-1 min-w-[280px]">
 <div className="relative flex-1">
 <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <Input
 ref={barcodeRef}
 value={barcodeInput}
 onChange={e => setBarcodeInput(e.target.value)}
 placeholder="Scan or type barcode..."
 className="pl-9 font-mono text-sm"
 autoFocus
 />
 </div>
 <Button type="submit" size="sm" className="gap-1.5">
 Find
 </Button>
 </form>
 <Button
 variant="secondary"
 size="sm"
 className="gap-1.5"
 onClick={handleAiCount}
 disabled={aiCounting}
 >
 <Sparkles className={`w-4 h-4 ${aiCounting ? "animate-pulse" : ""}`} />
 {aiCounting ? "AI Counting..." : "AI Count"}
 </Button>
 </div>

 <div className="overflow-x-auto rounded-lg border border-border">
 <table className="w-full text-sm">
 <thead>
 <tr className="bg-muted/50 border-b border-border">
 <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Product</th>
 <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">SKU</th>
 <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Barcode</th>
 <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Expected</th>
 <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Actual</th>
 <th className="text-right px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Diff</th>
 <th className="text-left px-4 py-2.5 font-medium text-muted-foreground text-xs uppercase tracking-wider">Notes</th>
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
 onClick={() => {
 setHighlightedId(null)
 focusEditingQty(item.id)
 }}
 >
 <td className="px-4 py-2.5">
 <span className="font-medium">{item.product.name}</span>
 </td>
 <td className="px-4 py-2.5">
 <span className="font-mono text-xs text-muted-foreground">{item.product.sku}</span>
 </td>
 <td className="px-4 py-2.5">
 <span className="font-mono text-xs text-muted-foreground">
 {item.product.barcode || "—"}
 </span>
 </td>
 <td className="px-4 py-2.5 text-right font-mono text-sm">{item.expectedQty}</td>
 <td className="px-4 py-2.5 text-right">
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
 className="w-20 text-right font-mono text-sm px-2 py-1 rounded border border-blue-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
 autoFocus
 />
 ) : (
 <span
 className="font-mono text-sm cursor-pointer hover:bg-blue-50 px-2 py-1 rounded"
 onClick={e => { e.stopPropagation(); focusEditingQty(item.id) }}
 >
 {item.actualQty}
 </span>
 )}
 </td>
 <td className="px-4 py-2.5 text-right font-mono text-sm">
 <span className={item.difference !== 0 ? "text-red-600 font-semibold" : "text-muted-foreground"}>
 {item.difference > 0 ? `+${item.difference}` : item.difference}
 </span>
 </td>
 <td className="px-4 py-2.5 text-sm text-muted-foreground">{item.notes || "—"}</td>
 </tr>
 )
 })}
 </tbody>
 </table>
 </div>
 </CardContent>
 </Card>

 <Card className={discrepancies.length > 0 ? "border-red-200/50" : ""}>
 <CardHeader>
 <CardTitle className={`text-base flex items-center gap-2 ${discrepancies.length > 0 ? "text-red-700" : "text-emerald-700"}`}>
  {discrepancies.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
 Discrepancy Report ({discrepancies.length})
 </CardTitle>
 </CardHeader>
 <CardContent className={discrepancies.length > 0 ? "p-0" : "p-6"}>
 {discrepancies.length > 0 ? (
 <div className="divide-y divide-border">
 {discrepancies.map((item) => (
 <div key={item.id} className="flex items-center justify-between p-4">
 <div>
 <p className="text-sm font-medium">{item.product.name}</p>
 <p className="text-xs text-muted-foreground">SKU: {item.product.sku}</p>
 {item.product.barcode && (
 <p className="text-xs text-muted-foreground font-mono">Barcode: {item.product.barcode}</p>
 )}
 </div>
 <div className="text-right">
 <p className="text-sm">
 Expected: <span className="font-mono">{item.expectedQty}</span>
 </p>
 <p className="text-sm">
 Actual: <span className="font-mono">{item.actualQty}</span>
 </p>
 <p className={`text-sm font-semibold font-mono ${item.difference < 0 ? "text-red-600" : "text-amber-600"}`}>
 {item.difference > 0 ? `+${item.difference}` : item.difference}
 </p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center py-6 animate-fade-in">
 <p className="text-sm text-muted-foreground">All items matched — no discrepancies</p>
 </div>
 )}
 </CardContent>
 </Card>

 <ConfirmDialog
 open={deleteOpen}
 onOpenChange={setDeleteOpen}
 title="Delete Stock Count"
 description={`Are you sure you want to delete stock count "${stockCount.number}"? This action cannot be undone.`}
 onConfirm={handleDelete}
 loading={deleting}
 />
 </div>
 )
}
