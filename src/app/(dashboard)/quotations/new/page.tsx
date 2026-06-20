"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn, formatCurrency } from "@/lib/utils"
import { AlertTriangle, FileText, Package, Receipt, XCircle, ShoppingCart } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs font-medium">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export default function NewQuotationPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customerId, setCustomerId] = useState("")
  const [validUntil, setValidUntil] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number }[]>([])

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then((json) => {
      if (json?.success && Array.isArray(json.data)) setCustomers(json.data)
    }).catch((err) => setError(err.message))
    fetch("/api/products").then(r => r.json()).then((json) => {
      if (json?.success && Array.isArray(json.data)) setProducts(json.data)
    }).catch((err) => setError(err.message))
  }, [])

  function addItem() {
    setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: 0 }])
  }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...items]
    if (field === "productId") {
      const product = products.find(p => p.id === value)
      newItems[index] = { ...newItems[index], productId: value, productName: product?.name || "", unitPrice: product?.unitPrice || 0 }
    } else {
      (newItems[index] as any)[field] = value
    }
    setItems(newItems)
  }

  async function handleSave() {
    if (!customerId) { toast.error("Please select a customer"); return }
    if (items.length === 0 || !items[0].productId) { toast.error("Please add at least one item"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          validUntil: validUntil || undefined,
          notes: notes || undefined,
          items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to save")
      }
      toast.success("Quotation created")
      router.push("/quotations")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setSaving(false)
    }
  }

  const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )
  return (
    <div className="animate-fade-in pb-28">
      <div className="page-header"><h1>New Quotation</h1><p>Create a quotation from product catalog</p></div>

      <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4" />
                Quotation Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer" required>
                  <Select
                    options={customers.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Select customer"
                    value={customerId}
                    onChange={(e: any) => setCustomerId(e.target.value)}
                  />
                </Field>
                <Field label="Valid Until">
                  <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </CardContent>
          </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4" />
                  Items (from catalog)
                </div>
                <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                  Add from Catalog
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {items.map((item, i) => (
                <div key={i} className="flex items-end gap-3 p-3 rounded-lg bg-surface/50">
                  <div className="flex-1">
                    <Field label="Product">
                      <Select
                        options={products.map(p => ({ value: p.id, label: `${p.name} (${formatCurrency(p.unitPrice)})` }))}
                        placeholder="Select product"
                        value={item.productId}
                        onChange={(e: any) => updateItem(i, "productId", e.target.value)}
                      />
                    </Field>
                  </div>
                  <div className="w-20">
                    <Field label="Qty">
                      <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} />
                    </Field>
                  </div>
                  <div className="w-28">
                    <Field label="Price">
                      <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                    </Field>
                  </div>
                  <div className="w-24 text-right pb-[2px]">
                    <p className="text-sm font-mono font-medium">{formatCurrency(item.quantity * item.unitPrice)}</p>
                  </div>
                  <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="p-2 text-muted-foreground hover:text-destructive" />
                </div>
              ))}
              {items.length === 0 && (
                <EmptyState
                  icons={[<Package key="q1" className="w-6 h-6" />, <Receipt key="q2" className="w-6 h-6" />, <ShoppingCart key="q3" className="w-6 h-6" />]}
                  title="No items added yet"
                  description="Select products from your catalog to add to this quotation"
                  actions={[{ label: "Browse Catalog", onClick: addItem }]}
                  size="sm"
                />
              )}
            </CardContent>
          </Card>
        </div>

          <div className="col-span-4 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Receipt className="w-4 h-4" />
                  Summary
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span>{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="border-t border-border pt-4 mt-4 flex items-center justify-end gap-3">
        <Button variant="secondary" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Quotation"}</Button>
      </div>
    </div>
  )
}
