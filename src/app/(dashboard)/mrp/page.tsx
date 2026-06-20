"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { SemanticBadge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertTriangle, BarChart3, Package, RefreshCw, ShoppingCart } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { toast } from "sonner"

type MRPItem = { productId: string; productName: string; sku: string; requiredQty: number; availableStock: number; shortage: number; suggestedPO: boolean; suggestedQty: number; leadTime: number; preferredSupplierName?: string }

export default function MRPPage() {
 const [horizon, setHorizon] = useState("30")
  const [data, setData] = useState<{ finishedGoods: MRPItem[]; rawMaterials: MRPItem[]; summary: { totalShortfall: number; suggestedPOs: number; totalPOValue: number } } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

 async function runMRP() {
 setLoading(true)
 try {
 const res = await fetch(`/api/mrp?horizonDays=${horizon}`)
 const d = await res.json()

 setData({
 finishedGoods: d.finishedGoods?.map((fg: any) => fg) ?? [],
 rawMaterials: d.rawMaterials?.map((rm: any) => rm) ?? [],
 summary: d.summary ?? { totalShortfall: 0, suggestedPOs: 0, totalPOValue: 0 }})
  } catch (err: any) { setError(err.message || "MRP calculation failed") }
 finally { setLoading(false) }
 }

 const shortages = data?.rawMaterials?.filter(r => r.shortage > 0) ?? []

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Material Requirements Planning</h1><p>Calculate material needs based on sales orders and BOMs</p></div>
 <div className="flex items-center gap-3">
 <Select options={[{ value: "15", label: "15 days" }, { value: "30", label: "30 days" }, { value: "60", label: "60 days" }, { value: "90", label: "90 days" }]} value={horizon} onChange={(e: any) => setHorizon(e.target.value)} className="w-32" />
 <Button onClick={runMRP} loading={loading} className="gap-1.5"><RefreshCw className="w-4 h-4" /> Run MRP</Button>
 </div>
 </div>

  {error ? (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  ) : !data ? (
  <EmptyState
 icons={[<BarChart3 key="1" className="w-6 h-6" />, <Package key="2" className="w-6 h-6" />, <ShoppingCart key="3" className="w-6 h-6" />]}
 title="Run MRP Calculation"
 description='Click "Run MRP" to calculate material requirements based on confirmed sales orders and approved BOMs.'
 actions={[{ label: "Run MRP", onClick: runMRP }]}
 />
 ) : (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{data.finishedGoods.length}</p><p className="text-xs text-muted-foreground">Finished Goods</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{data.rawMaterials.length}</p><p className="text-xs text-muted-foreground">Raw Materials</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-destructive">{shortages.length}</p><p className="text-xs text-muted-foreground">Materials with Shortage</p></CardContent></Card>
 <Card><CardContent className="p-4"><p className="text-2xl font-semibold">{data.summary.suggestedPOs}</p><p className="text-xs text-muted-foreground">Suggested POs</p></CardContent></Card>
 </div>

 {shortages.length > 0 && (
 <Card className="border-destructive/20">
 <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="w-4 h-4" /> Shortage Alerts</CardTitle></CardHeader>
 <CardContent>
 <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Material</th><th className="pb-2 font-medium text-right">Required</th><th className="pb-2 font-medium text-right">Available</th><th className="pb-2 font-medium text-right">Shortage</th><th className="pb-2 font-medium text-right">Suggested Qty</th><th className="pb-2 font-medium">Supplier</th></tr></thead>
 <tbody>{shortages.map(item => (
 <tr key={item.productId} className="border-b border-border/50"><td className="py-2"><span className="font-medium">{item.productName}</span><span className="text-xs text-muted-foreground ml-2 font-mono">{item.sku}</span></td>
 <td className="py-2 text-right font-mono">{item.requiredQty}</td><td className="py-2 text-right font-mono">{item.availableStock}</td>
 <td className="py-2 text-right font-mono text-destructive font-semibold">{item.shortage}</td>
 <td className="py-2 text-right font-mono font-semibold">{item.suggestedQty}</td>
 <td className="py-2 text-sm">{item.preferredSupplierName || "—"}</td></tr>
 ))}</tbody></table>
 </CardContent>
 </Card>
 )}

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <Card><CardHeader><CardTitle className="flex items-center gap-2">Finished Goods Demand</CardTitle></CardHeader>
 <CardContent>
 <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Product</th><th className="pb-2 font-medium text-right">Demand</th><th className="pb-2 font-medium text-right">Stock</th><th className="pb-2 font-medium text-right">Shortage</th></tr></thead>
 <tbody>{data.finishedGoods.map(fg => (
 <tr key={fg.productId} className="border-b border-border/50"><td className="py-2"><span className="font-medium">{fg.productName}</span></td>
 <td className="py-2 text-right font-mono">{fg.requiredQty}</td><td className="py-2 text-right font-mono">{fg.availableStock}</td>
 <td className="py-2 text-right font-mono">{fg.shortage > 0 ? <span className="text-destructive font-semibold">{fg.shortage}</span> : <span>0</span>}</td></tr>
 ))}</tbody></table>
 </CardContent>
 </Card>

 <Card><CardHeader><CardTitle className="flex items-center gap-2">Raw Material Requirements</CardTitle></CardHeader>
 <CardContent>
 <table className="w-full text-sm"><thead><tr className="text-left text-muted-foreground border-b border-border"><th className="pb-2 font-medium">Material</th><th className="pb-2 font-medium text-right">Required</th><th className="pb-2 font-medium text-right">Stock</th><th className="pb-2 font-medium text-right">Status</th></tr></thead>
 <tbody>{data.rawMaterials.map(rm => (
 <tr key={rm.productId} className="border-b border-border/50"><td className="py-2"><span className={rm.shortage > 0 ? "font-medium text-destructive" : ""}>{rm.productName}</span></td>
 <td className="py-2 text-right font-mono">{rm.requiredQty}</td><td className="py-2 text-right font-mono">{rm.availableStock}</td>
 <td className="py-2 text-right">{rm.shortage > 0 ? <SemanticBadge semantic="shortage" category="status">Short {rm.shortage}</SemanticBadge> : <SemanticBadge semantic="ok" category="status">OK</SemanticBadge>}</td></tr>
 ))}</tbody></table>
 </CardContent>
 </Card>
 </div>
 </div>
 )}
 </div>
 )
}
