"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Building2, Phone, Gauge, BadgeCheck, MapPinned, XCircle } from "lucide-react"
import { toast } from "sonner"

function Field({ label, required, className, children }: React.HTMLAttributes<HTMLDivElement> & { label: string; required?: boolean }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export default function NewWarehousePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "",
    description: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
    phone: "",
    email: "",
    manager: "",
    capacity: "",
    capacityUnit: "",
    temperatureMin: "",
    temperatureMax: "",
    humidity: "",
    operatingHours: "",
    status: "",
    priority: "",
    location: "",
  })

  function set(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name) { toast.error("Name is required"); return }
    setLoading(true)
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          location: form.location || null,
          capacity: form.capacity ? parseInt(form.capacity) : null,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Warehouse created")
      router.push("/warehouses")
      router.refresh()
    } catch { toast.error("Failed to create") }
    finally { setLoading(false) }
  }

  return (
    <div className="pb-28">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        Back
      </button>
      <div className="page-header"><h1>New Warehouse</h1></div>
      <form onSubmit={handleSubmit} className="grid grid-cols-12 gap-4">
        <div className="col-span-8 space-y-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4" />
                General Information
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" required>
                  <Input value={form.name} onChange={set("name")} required />
                </Field>
                <Field label="Code">
                  <Input value={form.code} onChange={set("code")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <Input value={form.type} onChange={set("type")} />
                </Field>
                <Field label="Description">
                  <Input value={form.description} onChange={set("description")} />
                </Field>
              </div>
              <Field label="Address">
                <Input value={form.address} onChange={set("address")} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="City">
                  <Input value={form.city} onChange={set("city")} />
                </Field>
                <Field label="Postal Code">
                  <Input value={form.postalCode} onChange={set("postalCode")} />
                </Field>
                <Field label="Country">
                  <Input value={form.country} onChange={set("country")} />
                </Field>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Phone className="w-4 h-4" />
                Contact
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <Input value={form.phone} onChange={set("phone")} />
                </Field>
                <Field label="Email">
                  <Input value={form.email} onChange={set("email")} />
                </Field>
              </div>
              <Field label="Manager">
                <Input value={form.manager} onChange={set("manager")} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="w-4 h-4" />
                Operational Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity">
                  <Input type="number" min="0" value={form.capacity} onChange={set("capacity")} />
                </Field>
                <Field label="Capacity Unit">
                  <Input value={form.capacityUnit} onChange={set("capacityUnit")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Temp. Min">
                  <Input type="number" value={form.temperatureMin} onChange={set("temperatureMin")} />
                </Field>
                <Field label="Temp. Max">
                  <Input type="number" value={form.temperatureMax} onChange={set("temperatureMax")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Humidity">
                  <Input type="number" value={form.humidity} onChange={set("humidity")} />
                </Field>
                <Field label="Operating Hours">
                  <Input value={form.operatingHours} onChange={set("operatingHours")} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4 space-y-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BadgeCheck className="w-4 h-4" />
                Status
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Field label="Status">
                <Input value={form.status} onChange={set("status")} />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPinned className="w-4 h-4" />
                Location / Priority
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Field label="Location">
                <Input value={form.location} onChange={set("location")} />
              </Field>
              <Field label="Priority">
                <Input type="number" min="0" value={form.priority} onChange={set("priority")} />
              </Field>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 flex items-center justify-end gap-3 pt-4 border-t border-border sticky bottom-0 bg-background shadow-lg shadow-black/5">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <XCircle className="w-4 h-4" /> Cancel
          </Button>
          <Button type="submit" loading={loading}>Create Warehouse</Button>
        </div>
      </form>
    </div>
  )
}
