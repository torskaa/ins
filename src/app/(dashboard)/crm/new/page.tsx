"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { User, XCircle } from "lucide-react"
import { useFormValidation } from "@/hooks/use-form-validation"
import { customerSchema } from "@/lib/validation"

const Field = ({ id, label, required, children, error, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; error?: string; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
    {error && <p className="text-xs text-destructive">{error}</p>}
  </div>
)

export default function NewCustomerPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useFormValidation(customerSchema)
  const [loading, setLoading] = useState(false)

  async function onSubmit(data: any) {
    setLoading(true)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      toast.success("Customer created")
      router.push("/crm")
      router.refresh()
    } catch {
      toast.error("Failed to create customer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-in pb-28">
      <div className="page-header mb-5">
        <h1>Add Customer</h1>
        <p>Create a new customer record</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-sm font-semibold">Customer Information</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field id="name" label="Name" required error={errors.name?.message}>
                    <Input id="name" {...register("name")} />
                  </Field>
                  <Field id="company" label="Company" error={errors.company?.message}>
                    <Input id="company" {...register("company")} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field id="email" label="Email" error={errors.email?.message}>
                    <Input id="email" type="email" {...register("email")} />
                  </Field>
                  <Field id="phone" label="Phone" error={errors.phone?.message}>
                    <Input id="phone" {...register("phone")} />
                  </Field>
                </div>
                <Field id="address" label="Address" error={errors.address?.message}>
                  <Textarea id="address" {...register("address")} />
                </Field>
                <Field id="taxId" label="Tax ID" error={errors.taxId?.message}>
                  <Input id="taxId" {...register("taxId")} />
                </Field>
                <Field id="notes" label="Notes" error={errors.notes?.message}>
                  <Textarea id="notes" {...register("notes")} />
                </Field>
              </CardContent>
            </Card>
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <Button type="submit" loading={loading}>Create Customer</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
      </form>
    </div>
  )
}
