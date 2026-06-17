"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { formatCurrency, cn } from "@/lib/utils"
import { XCircle, FileText, Package, DollarSign } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

export default function NewInvoicePage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [customerId, setCustomerId] = useState("")
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0])
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [items, setItems] = useState<{ productId: string; description: string; quantity: number; unitPrice: number; total: number }[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then(r => r.json()),
      fetch("/api/products").then(r => r.json()),
    ]).then(([c, p]) => {
      if (Array.isArray(c)) setCustomers(c)
      if (Array.isArray(p)) setProducts(p)
    })
  }, [])

  function addItem() {
    setItems([...items, { productId: "", description: "", quantity: 1, unitPrice: 0, total: 0 }])
  }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...items]
    if (field === "productId") {
      const product = products.find(p => p.id === value)
      newItems[index] = {
        ...newItems[index],
        productId: value,
        description: product?.name || "",
        unitPrice: product?.unitPrice || 0,
        total: (product?.unitPrice || 0) * newItems[index].quantity,
      }
    } else {
      (newItems[index] as any)[field] = value
      if (field === "quantity" || field === "unitPrice") {
        newItems[index].total = newItems[index].quantity * newItems[index].unitPrice
      }
    }
    setItems(newItems)
  }

  async function handleSave() {
    if (!customerId) { toast.error("Please select a customer"); return }
    if (items.length === 0 || !items[0].productId) { toast.error("Please add at least one item"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId,
          issueDate,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
          items: items.map(i => ({
            productId: i.productId,
            description: i.description,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to save") }
      toast.success("Invoice created")
      router.push("/invoices")
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const subtotal = items.reduce((s, i) => s + i.total, 0)

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">Back</button>
      <div className="page-header mb-5"><h1>New Invoice</h1><p>Create a customer invoice</p></div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="w-4 h-4 text-primary" />
                Invoice Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Field label="Customer *" required>
                <Select options={customers.map(c => ({ value: c.id, label: `${c.name}${c.company ? ` (${c.company})` : ""}` }))} placeholder="Select customer" value={customerId} onChange={(e: any) => setCustomerId(e.target.value)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Issue Date">
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </Field>
                <Field label="Due Date">
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </Field>
              </div>
              <Field label="Notes">
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Package className="w-4 h-4 text-primary" />
                  Invoice Items
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">Add Item</Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-2">Add line items to this invoice</p>
                  <Button type="button" variant="secondary" size="sm" onClick={addItem}>Add Item</Button>
                </div>
              ) : null}
              {items.map((item, i) => (
                <div key={i} className="flex items-end gap-3 p-3 rounded-lg bg-surface/50">
                  <div className="flex-[2] space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">Product</Label>
                    <Select options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))} placeholder="Select product" value={item.productId} onChange={(e: any) => updateItem(i, "productId", e.target.value)} />
                  </div>
                  <div className="w-20 space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">Qty</Label>
                    <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(i, "quantity", parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="w-28 space-y-1.5">
                    <Label className="text-[10px] text-muted-foreground">Price</Label>
                    <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, "unitPrice", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div className="w-24 text-right pb-1">
                    <p className="text-sm font-mono font-medium">{formatCurrency(item.total)}</p>
                  </div>
                  <button onClick={() => setItems(items.filter((_, idx) => idx !== i))} className="p-2 text-muted-foreground hover:text-destructive">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="w-4 h-4 text-primary" />
                Summary
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary/5 border border-primary/10">
                <span className="text-sm font-medium">Subtotal</span>
                <span className="text-lg font-semibold font-mono text-primary">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                <span className="text-sm font-medium">Items</span>
                <span className="text-lg font-semibold font-mono">{items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
        <Button variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
        <Button onClick={handleSave} loading={saving}>Create Invoice</Button>
      </div>
    </div>
  )
}
