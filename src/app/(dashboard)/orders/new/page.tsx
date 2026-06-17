"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { formatCurrency, cn } from "@/lib/utils"
import { XCircle, ShoppingCart, FileText, Package, ClipboardList } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1.5", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

function NewOrderForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams.get("type") || "sales"
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<any[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number }[]>([])
  const [customerId, setCustomerId] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [notes, setNotes] = useState("")
  const [expectedDate, setExpectedDate] = useState("")

  useEffect(() => {
    fetch("/api/customers").then(r => r.json()).then((data) => { if (Array.isArray(data)) setCustomers(data) }).catch(() => {})
    fetch("/api/suppliers").then(r => r.json()).then((data) => { if (Array.isArray(data)) setSuppliers(data) }).catch(() => {})
    fetch("/api/products").then(r => r.json()).then((data) => { if (Array.isArray(data)) setProducts(data) }).catch(() => {})
  }, [])

  function addItem() {
    setItems([...items, { productId: "", productName: "", quantity: 1, unitPrice: 0 }])
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index))
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

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (items.length === 0) {
      toast.error("Please add at least one item")
      return
    }
    setLoading(true)
    try {
      const body: any = {
        type,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
        notes,
        expectedDate: expectedDate || undefined,
        status: "draft",
      }
      if (type === "sales") body.customerId = customerId
      else body.supplierId = supplierId

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Order created")
      router.push("/orders")
      router.refresh()
    } catch {
      toast.error("Failed to create order")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">Back</button>
      <div className="page-header mb-5">
        <h1>New {type === "sales" ? "Sales" : "Purchase"} Order</h1>
        <p>Create a new order in the system</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShoppingCart className="w-4 h-4 text-primary" />
                  Order Details
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field label={`${type === "sales" ? "Customer" : "Supplier"} *`}>
                  {type === "sales" ? (
                    <Select options={customers.map(c => ({ value: c.id, label: c.name }))} placeholder="Select customer" value={customerId} onChange={(e: any) => setCustomerId(e.target.value)} />
                  ) : (
                    <Select options={suppliers.map(s => ({ value: s.id, label: s.name }))} placeholder="Select supplier" value={supplierId} onChange={(e: any) => setSupplierId(e.target.value)} />
                  )}
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Expected Date">
                    <Input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                  </Field>
                </div>
                <Field label="Notes">
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                </Field>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Package className="w-4 h-4 text-primary" />
                    Order Items
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addItem} className="h-7 text-xs">Add Item</Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {items.length === 0 ? (
                  <EmptyState
                    icons={[<Package key="o1" className="w-6 h-6" />, <ShoppingCart key="o2" className="w-6 h-6" />, <ClipboardList key="o3" className="w-6 h-6" />]}
                    title="No items added yet"
                    description="Add products to include in this order"
                    actions={[{ label: "Add your first item", onClick: addItem }]}
                    size="sm"
                  />
                ) : (
                  items.map((item, index) => (
                    <div key={index} className="flex items-end gap-3 p-3 rounded-lg bg-surface/50">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground">Product</Label>
                        <Select options={products.map(p => ({ value: p.id, label: `${p.name} (${p.sku})` }))} placeholder="Select product" value={item.productId} onChange={(e: any) => updateItem(index, "productId", e.target.value)} />
                      </div>
                      <div className="w-20 space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground">Qty</Label>
                        <Input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)} />
                      </div>
                      <div className="w-28 space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground">Unit Price</Label>
                        <Input type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="w-24 text-right pb-1">
                        <p className="text-sm font-mono font-medium">{formatCurrency(item.quantity * item.unitPrice)}</p>
                      </div>
                      <button type="button" onClick={() => removeItem(index)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-4 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FileText className="w-4 h-4 text-primary" />
                  Summary
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                  <span className="text-sm font-medium">Total Items</span>
                  <span className="text-lg font-semibold font-mono">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-sm font-medium">Total Amount</span>
                  <span className="text-lg font-semibold font-mono text-primary">{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
          <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
          <Button type="submit" loading={loading}>Create Order</Button>
        </div>
      </form>
    </div>
  )
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="animate-fade-in"><div className="page-header"><h1>Loading...</h1></div></div>}>
      <NewOrderForm />
    </Suspense>
  )
}
