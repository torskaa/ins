"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Edit, Beaker, CheckCircle, Play } from "lucide-react"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"

const statusColors: Record<string, string> = {
 draft: "bg-slate-100 text-slate-600",
 confirmed: "bg-blue-100 text-blue-700",
 in_progress: "bg-amber-100 text-amber-700",
 completed: "bg-emerald-100 text-emerald-700",
 cancelled: "bg-red-100 text-red-700",
}

type DetailOrder = {
 id: string; number: string; status: string; quantity: number; producedQty: number
 startDate: string | null; dueDate: string | null; completedDate: string | null; notes: string | null
 product: { id: string; name: string; sku: string; unitPrice: number | null }
 bom: { id: string; finishedGoodId: string; version: string; status: string } | null
 warehouse: { id: string; name: string; location: string | null } | null
 materials: Array<{ id: string; product: { id: string; name: string; sku: string; unitPrice: number | null }; quantityNeeded: number; quantityIssued: number }>
 operations: Array<{ id: string; sequence: number; name: string; setupTime: number; runTime: number; workCenter: { id: string; name: string; costPerHour: number } }>
}

const transitionLabels: Record<string, string> = {
 draft: "Confirm Order",
 confirmed: "Start Production",
 in_progress: "Complete Order",
}
const transitionActions: Record<string, string> = {
 draft: "confirmed",
 confirmed: "in_progress",
 in_progress: "completed",
}
const transitionIcons: Record<string, any> = {
 draft: CheckCircle,
 confirmed: Play,
 in_progress: CheckCircle,
}

export default function ProductionOrderDetailPage() {
 const router = useRouter()
 const params = useParams()
 const [order, setOrder] = useState<DetailOrder | null>(null)
 const [loading, setLoading] = useState(true)
 const [transitioning, setTransitioning] = useState(false)
 const [producedInput, setProducedInput] = useState("")

 useEffect(() => {
 fetch(`/api/production-orders/${params.id}`)
 .then(r => r.json())
 .then(d => {
 if (d.error) { toast.error(d.error); return }
 setOrder(d)
 setProducedInput(String(d.quantity))
 })
 .finally(() => setLoading(false))
 }, [params.id])

 async function handleTransition(action: string) {
 setTransitioning(true)
 try {
 const body: any = { action }
 if (action === "completed" && producedInput) body.producedQty = parseInt(producedInput)
 const res = await fetch(`/api/production-orders/${params.id}/status`, {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(body),
 })
 if (!res.ok) { const e = await res.json(); throw new Error(e.error) }
 toast.success(`Order ${action.replace(/_/g, " ")}`)
 // Refresh
 const updated = await fetch(`/api/production-orders/${params.id}`).then(r => r.json())
 setOrder(updated)
 setProducedInput(String(updated.quantity))
 } catch (err: any) { toast.error(err.message) }
 finally { setTransitioning(false) }
 }

 if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48 rounded-lg" /><Skeleton className="h-64 w-full rounded-xl" /></div>
 if (!order) return <div className="text-center text-muted-foreground py-20">Order not found</div>

 const nextAction = transitionActions[order.status]
 const totalSetup = order.operations.reduce((s, o) => s + o.setupTime, 0)
 const totalRun = order.operations.reduce((s, o) => s + o.runTime, 0)
 const totalCost = order.operations.reduce((s, o) => s + (o.setupTime + o.runTime) / 60 * o.workCenter.costPerHour, 0)

 return (
 <div className="animate-fade-in max-w-4xl">
 <button onClick={() => router.push("/production/orders")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back to Orders
 </button>

 <div className="flex items-start justify-between mb-6">
 <div>
 <div className="flex items-center gap-3 mb-1">
 <h1 className="font-mono">{order.number}</h1>
 <Badge className={`${statusColors[order.status] || ""} border-0 font-medium`}>{order.status.replace(/_/g, " ")}</Badge>
 </div>
 <div className="flex items-center gap-4 text-sm text-muted-foreground">
 <span className="flex items-center gap-1">{order.product.name} ({order.product.sku})</span>
 {order.warehouse && <span className="flex items-center gap-1">{order.warehouse.name}</span>}
 </div>
 </div>
 <div className="flex items-center gap-2">
 {["draft", "confirmed"].includes(order.status) && (
 <Button variant="outline" size="sm" onClick={() => router.push(`/production/orders/${order.id}/edit`)} className="gap-1.5">
 Edit
 </Button>
 )}
 {nextAction && (
 <Button size="sm" onClick={() => handleTransition(nextAction)} loading={transitioning} className="gap-1.5">
 {(() => { const Icon = transitionIcons[order.status]; return Icon ? <><Icon className="w-4 h-4" /> {transitionLabels[order.status]}</> : transitionLabels[order.status] })()}
 </Button>
 )}
 </div>
 </div>

 <div className="grid grid-cols-4 gap-4 mb-6">
 <Card><CardContent className="p-4">
 <p className="text-xs text-muted-foreground">Quantity</p>
 <p className="text-2xl font-semibold">{order.quantity}</p>
 </CardContent></Card>
 <Card><CardContent className="p-4">
 <p className="text-xs text-muted-foreground">Produced</p>
 <p className={`text-2xl font-semibold ${order.producedQty > 0 ? "text-emerald-600" : "text-muted-foreground"}`}>{order.producedQty || 0}</p>
 </CardContent></Card>
 <Card><CardContent className="p-4">
 <p className="text-xs text-muted-foreground">Due Date</p>
 <p className="text-lg font-medium">{order.dueDate ? format(new Date(order.dueDate), "dd/MM/yyyy") : "—"}</p>
 </CardContent></Card>
 <Card><CardContent className="p-4">
 <p className="text-xs text-muted-foreground">Est. Cost</p>
 <p className="text-lg font-medium font-mono">฿{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
 </CardContent></Card>
 </div>

 {order.status === "in_progress" && (
 <Card className="mb-6 border-amber-200 bg-amber-50/50">
 <CardContent className="p-4 flex items-center gap-4">
 <div className="flex-1">
 <Label className="text-xs font-medium text-amber-700 mb-1 block">Quantity Produced</Label>
 <Input type="number" min="1" value={producedInput} onChange={(e) => setProducedInput(e.target.value)} className="w-32 bg-white" />
 </div>
 <Button size="sm" onClick={() => handleTransition("completed")} loading={transitioning} className="gap-1.5 mt-5">
 Complete Order
 </Button>
 </CardContent>
 </Card>
 )}

 <div className="grid grid-cols-2 gap-6">
 <Card>
 <CardHeader className="pb-3 flex flex-row items-center justify-between">
 <h3 className="text-sm font-semibold flex items-center gap-2"><Beaker className="w-4 h-4" /> Materials ({order.materials.length})</h3>
 </CardHeader>
 <CardContent className="pt-0 space-y-2">
 {order.materials.length === 0 && <p className="text-sm text-muted-foreground">No materials</p>}
 {order.materials.map((m) => (
 <div key={m.id} className="flex items-center justify-between p-2.5 bg-surface rounded-lg">
 <div className="text-sm"><span className="font-medium">{m.product.name}</span><span className="text-xs text-muted-foreground ml-2">{m.product.sku}</span></div>
 <div className="font-mono text-sm">{m.quantityIssued}/{m.quantityNeeded}</div>
 </div>
 ))}
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="pb-3 flex flex-row items-center justify-between">
 <h3 className="text-sm font-semibold flex items-center gap-2">Operations ({order.operations.length})</h3>
 </CardHeader>
 <CardContent className="pt-0 space-y-2">
 {order.operations.length === 0 && <p className="text-sm text-muted-foreground">No operations</p>}
 {order.operations.map((o) => (
 <div key={o.id} className="flex items-center justify-between p-2.5 bg-surface rounded-lg">
 <div>
 <span className="text-sm font-medium">#{o.sequence} {o.name}</span>
 <span className="text-xs text-muted-foreground ml-2">{o.workCenter.name}</span>
 </div>
 <div className="text-xs text-muted-foreground font-mono">{o.setupTime + o.runTime}m</div>
 </div>
 ))}
 {order.operations.length > 0 && (
 <div className="flex items-center justify-between p-2.5 bg-surface rounded-lg border border-border">
 <span className="text-sm font-medium">Total</span>
 <span className="font-mono text-sm">{totalSetup + totalRun}m ({((totalSetup + totalRun) / 60).toFixed(1)}h)</span>
 </div>
 )}
 </CardContent>
 </Card>
 </div>

 {order.notes && (
 <Card className="mt-6">
 <CardHeader className="pb-2"><h3 className="text-sm font-semibold">Notes</h3></CardHeader>
 <CardContent className="pt-0"><p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p></CardContent>
 </Card>
 )}
 </div>
 )
}


