"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Activity, DollarSign, Layers, MapPin, MoreHorizontal, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"

type WorkCenter = {
 id: string
 code: string
 name: string
 description: string | null
 costPerHour: number
 capacity: number
 location: string | null
 isActive: boolean
 createdAt: string
}

export default function WorkCenterDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const { id } = use(params)
 const [wc, setWc] = useState<WorkCenter | null>(null)
 const [loading, setLoading] = useState(true)

 useEffect(() => {
 fetch(`/api/work-centers/${id}`)
 .then(r => r.json())
 .then(d => { if (d && !d.error) setWc(d); else toast.error("Work center not found") })
 .finally(() => setLoading(false))
 }, [id])

 if (loading) return <Skeleton className="h-64 w-full rounded-xl" />
 if (!wc) return <div className="animate-fade-in"><p>Work center not found</p><Button variant="secondary" onClick={() => router.push("/production/work-centers")}>Back</Button></div>

 return (
 <div className="animate-fade-in">
  <Breadcrumb className="mb-4">
  <BreadcrumbList>
  <BreadcrumbItem>
  <BreadcrumbLink asChild>
  <button onClick={() => router.push("/production/work-centers")}>Work Centers</button>
  </BreadcrumbLink>
  </BreadcrumbItem>
  <BreadcrumbSeparator />
  <BreadcrumbItem>
  <BreadcrumbPage>{wc.name}</BreadcrumbPage>
  </BreadcrumbItem>
  </BreadcrumbList>
  </Breadcrumb>

  <div className="page-header flex items-start justify-between">
  <div className="flex items-center gap-4">
  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center">
  </div>
  <div>
  <div className="flex items-center gap-2">
  <h1>{wc.name}</h1>
 <Badge variant={wc.isActive ? "default" : "secondary"}>{wc.isActive ? "Active" : "Inactive"}</Badge>
 </div>
 <p className="text-muted-foreground font-mono text-sm">{wc.code}</p>
 </div>
 </div>
  <div className="flex items-center gap-2">
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="ghost" size="sm" className="h-9 w-9 p-0"><MoreHorizontal className="w-4 h-4" /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
  <DropdownMenuItem onClick={() => router.push(`/production/work-centers/${id}/edit`)}><Pencil className="w-4 h-4 mr-2" /> Edit</DropdownMenuItem>
  </DropdownMenuContent>
  </DropdownMenu>
  </div>
 </div>

  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <DollarSign className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Cost per Hour</p>
  <p className="text-2xl font-semibold">฿{wc.costPerHour.toLocaleString()}</p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <Layers className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Capacity</p>
  <p className="text-2xl font-semibold">{wc.capacity}</p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <MapPin className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Location</p>
  <p className="text-2xl font-semibold">{wc.location || "—"}</p>
  </div>
  <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
  <Activity className="w-5 h-5 text-muted-foreground" />
  <p className="text-[11px] text-muted-foreground font-medium">Status</p>
  <p className="text-2xl font-semibold">{wc.isActive ? "Operational" : "Inactive"}</p>
  </div>
  </div>

 <Card>
 <CardHeader><CardTitle>Details</CardTitle></CardHeader>
 <CardContent className="space-y-4">
 {wc.description && <div><p className="text-sm text-muted-foreground mb-1">Description</p><p>{wc.description}</p></div>}
 <Separator />
 <div className="grid grid-cols-2 gap-4 text-sm">
 <div><span className="text-muted-foreground">Code</span><p className="font-mono">{wc.code}</p></div>
 <div><span className="text-muted-foreground">Cost/Hour</span><p>฿{wc.costPerHour.toLocaleString()}</p></div>
 <div><span className="text-muted-foreground">Capacity</span><p>{wc.capacity} units</p></div>
 <div><span className="text-muted-foreground">Location</span><p>{wc.location || "—"}</p></div>
 </div>
 </CardContent>
 </Card>

 <Card className="mt-6">
 <CardHeader><CardTitle className="flex items-center gap-2">Production Orders</CardTitle></CardHeader>
 <CardContent>
 <Button variant="secondary" size="sm" onClick={() => router.push(`/production/orders?workCenter=${wc.id}`)} className="gap-1.5">
 View Production Orders for this Work Center
 </Button>
 </CardContent>
 </Card>
 </div>
 )
}
