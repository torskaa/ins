"use client"

import { useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { XCircle, Package, List } from "lucide-react"

type Option = { id: string; name: string; sku: string; type: string }
type MaterialRow = {
  key: string
  materialId: string
  quantity: string
  scrapAllowance: string
  unit: string
  wastePercent: string
}

const UNITS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "g", label: "Gram (g)" },
  { value: "m", label: "Meter (m)" },
  { value: "l", label: "Liter (l)" },
  { value: "ml", label: "Milliliter (ml)" },
  { value: "cm", label: "Centimeter (cm)" },
  { value: "sqm", label: "Square Meter (sqm)" },
  { value: "box", label: "Box" },
  { value: "pack", label: "Pack" },
  { value: "set", label: "Set" },
]

export default function NewBOMPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [finishedGoods, setFinishedGoods] = useState<Option[]>([])
  const [materials, setMaterials] = useState<Option[]>([])
  const [finishedGoodId, setFinishedGoodId] = useState("")
  const [rows, setRows] = useState<MaterialRow[]>([createRow()])
  const [notes, setNotes] = useState("")

  useEffect(() => {
    async function load() {
      const [goodsRes, matsRes, allRes] = await Promise.all([
        fetch("/api/products?type=finished_good"),
        fetch("/api/materials"),
        fetch("/api/products?type=finished_good&all=true"),
      ])
      const goods = goodsRes.ok ? await goodsRes.json() : []
      const mats = matsRes.ok ? await matsRes.json() : []
      const all = allRes.ok ? await allRes.json() : []
      setFinishedGoods(Array.isArray(goods) ? goods : [])
      const subAssemblies = (Array.isArray(all) ? all : []).filter((p: Option) => p.type === "finished_good")
      setMaterials([...(Array.isArray(mats) ? mats : []), ...subAssemblies])
    }
    load()
  }, [])

  function createRow(): MaterialRow {
    return { key: crypto.randomUUID(), materialId: "", quantity: "1", scrapAllowance: "0", unit: "pcs", wastePercent: "0" }
  }

  function addRow() {
    setRows([...rows, createRow()])
  }

  function removeRow(key: string) {
    if (rows.length <= 1) return
    setRows(rows.filter((r) => r.key !== key))
  }

  function updateRow(key: string, field: keyof MaterialRow, value: string) {
    setRows(rows.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!finishedGoodId) {
      toast.error("Please select a finished good")
      return
    }
    const validRows = rows.filter((r) => r.materialId)
    if (validRows.length === 0) {
      toast.error("Add at least one material")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/bom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          finishedGoodId,
          items: validRows.map((r) => ({
            materialId: r.materialId,
            quantity: Number(r.quantity),
            scrapAllowance: Number(r.scrapAllowance),
            unit: r.unit,
            wastePercent: Number(r.wastePercent),
          })),
          notes,
        }),
      })
      if (!res.ok) throw new Error("Failed to create")
      toast.success("BOM created with " + validRows.length + " materials")
      router.push("/bom")
      router.refresh()
    } catch {
      toast.error("Failed to create BOM")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSubmit(e as any)
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [finishedGoodId, rows, notes])

  const Field = ({ id, label, required, children, className }: { id?: string; label: ReactNode; required?: boolean; children: ReactNode; className?: string }) => (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      {children}
    </div>
  )

  return (
    <div className="animate-fade-in pb-28">
      <div className="mb-5">
        <div className="page-header">
          <h1>New Bill of Materials</h1>
          <p>Define the materials required to produce a finished good</p>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span className="text-sm font-semibold">Finished Good</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="finishedGoodId" label="Finished Good" required>
                  <Select
                    id="finishedGoodId"
                    options={finishedGoods.map((g) => ({ value: g.id, label: g.name + " (" + g.sku + ")" }))}
                    placeholder="Select the product to produce..."
                    value={finishedGoodId}
                    onChange={(e: any) => setFinishedGoodId(e.target.value)}
                    required
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  <span className="text-sm font-semibold">Materials ({rows.filter((r) => r.materialId).length} selected)</span>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="hidden md:grid grid-cols-[1fr_80px_80px_100px_80px_40px] gap-3 px-3 py-2 text-xs text-muted-foreground font-medium">
                    <span>Component</span>
                    <span>Qty</span>
                    <span>Scrap</span>
                    <span>Unit</span>
                    <span>Waste %</span>
                    <span></span>
                  </div>

                  {rows.map((row, i) => {
                    const selectedMat = materials.find((m) => m.id === row.materialId)
                    const isSubAssembly = selectedMat?.type === "finished_good"
                    return (
                      <div
                        key={row.key}
                        className="grid grid-cols-1 md:grid-cols-[1fr_80px_80px_100px_80px_40px] gap-3 items-start p-3 rounded-lg bg-surface/50"
                      >
                        <div className="space-y-1">
                          <Label className="md:hidden text-xs">Component</Label>
                          <div className="relative">
                            {isSubAssembly && (
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 z-10">
                              </span>
                            )}
                            <Select
                              options={materials.map((m) => ({ value: m.id, label: m.name + " (" + m.sku + ")" + (m.type === "finished_good" ? " [Sub]" : "") }))}
                              placeholder="Select material..."
                              value={row.materialId}
                              className={isSubAssembly ? "pl-8" : ""}
                              onChange={(e: any) => updateRow(row.key, "materialId", e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="md:hidden text-xs">Qty</Label>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={row.quantity}
                            onChange={(e) => updateRow(row.key, "quantity", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="md:hidden text-xs">Scrap</Label>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            value={row.scrapAllowance}
                            onChange={(e) => updateRow(row.key, "scrapAllowance", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="md:hidden text-xs">Unit</Label>
                          <Select
                            options={UNITS}
                            value={row.unit}
                            onChange={(e: any) => updateRow(row.key, "unit", e.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="md:hidden text-xs">Waste %</Label>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            max="100"
                            value={row.wastePercent}
                            onChange={(e) => updateRow(row.key, "wastePercent", e.target.value)}
                          />
                        </div>
                        <div className="flex items-center pt-1 md:pt-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-destructive h-8 w-8"
                            onClick={() => removeRow(row.key)}
                            disabled={rows.length <= 1}
                          >
                          </Button>
                        </div>
                      </div>
                    )
                  })}

                  <Button type="button" variant="secondary" size="sm" onClick={addRow} className="gap-1.5 mt-2">Add Material</Button>

                  {rows.filter((r) => r.materialId).length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        Total: <strong>{rows.filter((r) => r.materialId).length}</strong> material(s) will be linked to this finished good
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-4 space-y-4" />
        </div>
        <div className="sticky bottom-0 mt-6 py-4 bg-background border-t border-border flex items-center justify-between z-30 shadow-lg shadow-black/5">
          <p className="text-xs text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface text-xs font-mono">Cmd+S</kbd> to save
          </p>
          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button type="submit" loading={saving}>Create BOM</Button>
          </div>
        </div>
      </form>
    </div>
  )
}
