"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, ArrowLeft, Calendar, Hash, Layers, Package, Warehouse } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Frame, FramePanel } from "@/components/reui/frame"
import { formatDateTime, cn } from "@/lib/utils"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"

const TYPE_COLORS: Record<string, string> = {
  received: "bg-success/15 text-success", sold: "bg-destructive/15 text-destructive",
  adjusted: "bg-warning/15 text-warning", transferred: "bg-info/15 text-info",
  returned: "bg-primary/10 text-primary", damaged: "bg-destructive/15 text-destructive",
  issued: "bg-warning/15 text-warning", produced: "bg-success/15 text-success",
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
    </div>
  )
}

export default function StockMovementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [id, setId] = useState("")
  const router = useRouter()

  useEffect(() => { params.then(({ id }) => setId(id)) }, [params])
  useEffect(() => {
    if (!id) return
    fetch(`/api/stock-movements/${id}`)
      .then(r => r.json())
      .then(r => { if (r?.success) setData(r.data); else setError(r?.error || "Failed to load") })
      .catch((err) => { setError(err.message || "Failed to load data") })
      .finally(() => setLoading(false))
  }, [id])

  if (error) {
    return (
      <EmptyState variant="default" title="Failed to load data" description={error} icons={[<Activity key="e1" className="w-6 h-6" />, <Package key="e2" className="w-6 h-6" />, <Warehouse key="e3" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }, { label: "Back", onClick: () => router.back() }]} />
    )
  }

  if (loading) return <SkeletonDetail cards={2} hasChart={false} />

  if (!data) {
    return <EmptyState variant="default" title="Movement not found" description="This stock movement does not exist or has been removed." icons={[<Activity key="e1" className="w-6 h-6" />]} actions={[{ label: "Back to Movements", onClick: () => router.push("/stock-movements") }]} />
  }

  return (
    <div className="animate-fade-in space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink href="/stock-movements">Stock Movements</BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>{data.reference || data.id.slice(0, 8)}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Frame>
        <FramePanel title="Movement Details" icon={<Activity className="w-4 h-4" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Field label="Type" value={data.type} />
            <Field label="Quantity" value={`${data.quantity > 0 ? "+" : ""}${data.quantity}`} mono />
            <Field label="Reference" value={data.reference || "—"} mono />
            <Field label="Product" value={data.product?.name || "—"} />
            <Field label="SKU" value={data.product?.sku || "—"} mono />
            <Field label="Warehouse" value={data.warehouse?.name || "—"} />
            <Field label="Lot" value={data.lot?.number || "—"} mono />
            <Field label="Delivery" value={data.delivery?.reference || "—"} mono />
            <Field label="Date" value={formatDateTime(new Date(data.createdAt))} />
          </div>

          {data.description && (
            <div className="mt-6 pt-6 border-t border-border/60">
              <p className="text-[11px] text-muted-foreground font-medium mb-1.5">Description</p>
              <p className="text-sm">{data.description}</p>
            </div>
          )}
        </FramePanel>
      </Frame>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={() => router.back()}><ArrowLeft className="w-4 h-4 mr-1.5" /> Back</Button>
      </div>
    </div>
  )
}
