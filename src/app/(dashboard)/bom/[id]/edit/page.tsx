"use client"

import { useState, useEffect, use, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { SkeletonForm } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { XCircle, Package, List } from "lucide-react"

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

  const Field = ({ id, label, required, children, className }: { id?: string; label: ReactNode; required?: boolean; children: ReactNode; className?: string }) => (
    <div className={cn("space-y-1", className)}>
      <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  )

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        Back
      </button>
      <div className="mb-5">
        <div className="page-header"><h1>Edit BOM</h1></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-semibold">Bill of Materials</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="finishedGoodId" label="Finished Good" required>
                  <Select options={goods.map((g) => ({ value: g.id, label: `${g.name} (${g.sku})` }))} placeholder="Select finished good" value={finishedGoodId} onChange={(e: any) => setFinishedGoodId(e.target.value)} />
                </Field>
              </CardContent>
            </Card>
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    <span className="text-sm font-semibold">Components</span>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setRows([...rows, createRow()])} className="gap-1">Add</Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {rows.map((row) => (
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
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={saving}>Update BOM</Button>
        </div>
      </form>
    </div>
  )
}
