"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { XCircle } from "lucide-react"

type MaterialRow = { key: string; materialId: string; quantity: string; scrapAllowance: string; unit: string; wastePercent: string }

const UNITS = [
 { value: "pcs", label: "Pieces (pcs)" }, { value: "kg", label: "Kilogram (kg)" }, { value: "g", label: "Gram (g)" },
 { value: "m", label: "Meter (m)" }, { value: "l", label: "Liter (l)" }, { value: "ml", label: "Milliliter (ml)" },
 { value: "cm", label: "Centimeter (cm)" }, { value: "sqm", label: "Square Meter (sqm)" },
 { value: "box", label: "Box" }, { value: "pack", label: "Pack" }, { value: "set", label: "Set" },
]

export default function EditBOMPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const { id } = use(params)
 const [saving, setSaving] = useState(false)
 const [fetching, setFetching] = useState(true)
 const [goods, setGoods] = useState<any[]>([])
 const [materials, setMaterials] = useState<any[]>([])
 const [finishedGoodId, setFinishedGoodId] = useState("")
 const [rows, setRows] = useState<MaterialRow[]>([])
 const [notes, setNotes] = useState("")

 useEffect(() => {
 async function load() {
 const [bomRes, goodsRes, matsRes] = await Promise.all([
 fetch(`/api/bom/${id}`),
 fetch("/api/products?type=finished_good"),
 fetch("/api/materials"),
 ])
 if (!bomRes.ok) { toast.error("BOM not found"); router.push("/bom"); return }
 const bomData = await bomRes.json()
 const goodsData = goodsRes.ok ? await goodsRes.json() : []
 const matsData = matsRes.ok ? await matsRes.json() : []

 setGoods(Array.isArray(goodsData) ? goodsData : [])
 const allMats = Array.isArray(matsData) ? matsData : []
 setMaterials(allMats)

 const bom = bomData.bom || bomData
 setFinishedGoodId(bom.finishedGoodId || "")

 if (bomData.components && Array.isArray(bomData.components)) {
 setRows(bomData.components.map((c: any) => ({
 key: crypto.randomUUID(),
 materialId: c.material?.id || c.materialId || "",
 quantity: String(c.quantity || 1),
 scrapAllowance: String(c.scrapAllowance || 0),
 unit: c.unit || "pcs",
 wastePercent: String(c.wastePercent || 0),
 })))
 } else {
 setRows([createRow()])
 }
 setNotes(bom.notes || "")
 setFetching(false)
 }
 load()
 }, [id, router])

 function createRow(): MaterialRow {
 return { key: crypto.randomUUID(), materialId: "", quantity: "1", scrapAllowance: "0", unit: "pcs", wastePercent: "0" }
 }

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!finishedGoodId) { toast.error("Please select a finished good"); return }
 if (rows.length === 0 || !rows[0].materialId) { toast.error("Please add at least one material"); return }
 setSaving(true)
 try {
 await Promise.all(rows.map((row) =>
 fetch(`/api/bom/${id}`, {
 method: "DELETE",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ materialId: row.materialId }),
 }).catch(() => {})
 ))
 for (const row of rows) {
 const res = await fetch("/api/bom", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 finishedGoodId,
 materialId: row.materialId,
 quantity: parseFloat(row.quantity) || 1,
 scrapAllowance: parseFloat(row.scrapAllowance) || 0,
 unit: row.unit,
 wastePercent: parseFloat(row.wastePercent) || 0,
 notes: notes || undefined,
 }),
 })
 if (!res.ok) throw new Error()
 }
 toast.success("BOM updated")
 router.push(`/bom/${id}`)
 router.refresh()
 } catch { toast.error("Failed to update BOM") }
 finally { setSaving(false) }
 }

 if (fetching) return <SkeletonForm fields={5} />

 return (
 <div className="animate-fade-in max-w-4xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
 Back
 </button>
 <div className="page-header"><h1>Edit BOM</h1></div>
 <form onSubmit={handleSubmit} className="space-y-6">
 <Card>
 <CardHeader><CardTitle className="flex items-center gap-2">Bill of Materials</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label>Finished Good <span className="text-destructive">*</span></Label>
 <Select options={goods.map((g) => ({ value: g.id, label: `${g.name} (${g.sku})` }))} placeholder="Select finished good" value={finishedGoodId} onChange={(e: any) => setFinishedGoodId(e.target.value)} />
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader className="flex flex-row items-center justify-between">
 <CardTitle>Components</CardTitle>
 <Button type="button" variant="secondary" size="sm" onClick={() => setRows([...rows, createRow()])} className="gap-1">Add</Button>
 </CardHeader>
 <CardContent className="space-y-3">
 {rows.map((row, i) => (
 <div key={row.key} className="flex items-end gap-2 p-3 rounded-lg bg-surface/50">
 <div className="flex-[2] space-y-1">
 <Label className="text-xs">Material</Label>
 <Select options={materials.map((m) => ({ value: m.id, label: `${m.name} (${m.sku})` }))} placeholder="Select material" value={row.materialId} onChange={(e: any) => setRows(rows.map((r) => r.key === row.key ? { ...r, materialId: e.target.value } : r))} />
 </div>
 <div className="w-20 space-y-1">
 <Label className="text-xs">Qty</Label>
 <Input type="number" min="0" step="0.01" value={row.quantity} onChange={(e) => setRows(rows.map((r) => r.key === row.key ? { ...r, quantity: e.target.value } : r))} />
 </div>
 <div className="w-20 space-y-1">
 <Label className="text-xs">Scrap %</Label>
 <Input type="number" min="0" value={row.scrapAllowance} onChange={(e) => setRows(rows.map((r) => r.key === row.key ? { ...r, scrapAllowance: e.target.value } : r))} />
 </div>
 <div className="w-24 space-y-1">
 <Label className="text-xs">Unit</Label>
 <Select options={UNITS} value={row.unit} onChange={(e: any) => setRows(rows.map((r) => r.key === row.key ? { ...r, unit: e.target.value } : r))} />
 </div>
 <Button type="button" variant="ghost" size="icon" className="mb-0.5" onClick={() => rows.length > 1 && setRows(rows.filter((r) => r.key !== row.key))}></Button>
 </div>
 ))}
 </CardContent>
 </Card>

 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={saving}>Update BOM</Button>
 </div>
 </form>
 </div>
 )
}
