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
import { z } from "zod"
import { useFormValidation } from "@/hooks/use-form-validation"

const warehouseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().optional(),
  type: z.string().optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  manager: z.string().optional(),
  capacity: z.string().optional(),
  capacityUnit: z.string().optional(),
  temperatureMin: z.string().optional(),
  temperatureMax: z.string().optional(),
  humidity: z.string().optional(),
  operatingHours: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  location: z.string().optional(),
})

function Field({ label, required, error, className, children }: React.HTMLAttributes<HTMLDivElement> & { label: string; required?: boolean; error?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <Label className="text-xs font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export default function NewWarehousePage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useFormValidation(warehouseSchema)
  const [loading, setLoading] = useState(false)

  async function onSubmit(data: any) {
    setLoading(true)
    try {
      const res = await fetch("/api/warehouses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          location: data.location || null,
          capacity: data.capacity ? parseInt(data.capacity) : null,
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
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-12 gap-4">
        <div className="col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Building2 className="w-4 h-4" />
                General Information
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" required error={errors.name?.message}>
                  <Input {...register("name")} />
                </Field>
                <Field label="Code" error={errors.code?.message}>
                  <Input {...register("code")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type" error={errors.type?.message}>
                  <Input {...register("type")} />
                </Field>
                <Field label="Description" error={errors.description?.message}>
                  <Input {...register("description")} />
                </Field>
              </div>
              <Field label="Address" error={errors.address?.message}>
                <Input {...register("address")} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="City" error={errors.city?.message}>
                  <Input {...register("city")} />
                </Field>
                <Field label="Postal Code" error={errors.postalCode?.message}>
                  <Input {...register("postalCode")} />
                </Field>
                <Field label="Country" error={errors.country?.message}>
                  <Input {...register("country")} />
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
                <Field label="Phone" error={errors.phone?.message}>
                  <Input {...register("phone")} />
                </Field>
                <Field label="Email" error={errors.email?.message}>
                  <Input {...register("email")} />
                </Field>
              </div>
              <Field label="Manager" error={errors.manager?.message}>
                <Input {...register("manager")} />
              </Field>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Gauge className="w-4 h-4" />
                Operational Details
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Capacity" error={errors.capacity?.message}>
                  <Input type="number" min="0" {...register("capacity")} />
                </Field>
                <Field label="Capacity Unit" error={errors.capacityUnit?.message}>
                  <Input {...register("capacityUnit")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Temp. Min" error={errors.temperatureMin?.message}>
                  <Input type="number" {...register("temperatureMin")} />
                </Field>
                <Field label="Temp. Max" error={errors.temperatureMax?.message}>
                  <Input type="number" {...register("temperatureMax")} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Humidity" error={errors.humidity?.message}>
                  <Input type="number" {...register("humidity")} />
                </Field>
                <Field label="Operating Hours" error={errors.operatingHours?.message}>
                  <Input {...register("operatingHours")} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BadgeCheck className="w-4 h-4" />
                Status
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Field label="Status" error={errors.status?.message}>
                <Input {...register("status")} />
              </Field>
            </CardContent>
          </Card>

          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MapPinned className="w-4 h-4" />
                Location / Priority
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <Field label="Location" error={errors.location?.message}>
                <Input {...register("location")} />
              </Field>
              <Field label="Priority" error={errors.priority?.message}>
                <Input type="number" min="0" {...register("priority")} />
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
