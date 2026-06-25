"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { FileText, ShoppingCart, FileSignature, Package, Download, ExternalLink, Eye } from "lucide-react"

type ArtifactType = "report" | "quotation" | "invoice" | "purchase-draft"

interface ArtifactCardProps {
  type: ArtifactType
  title: string
  description?: string
  status?: "draft" | "pending" | "completed"
  tag?: string | null
  timestamp?: Date
}

const config: Record<ArtifactType, { icon: React.ReactNode; label: string; color: string }> = {
  report: { icon: <FileText className="size-4" />, label: "Report", color: "text-blue-500" },
  quotation: { icon: <FileSignature className="size-4" />, label: "Quotation", color: "text-purple-500" },
  invoice: { icon: <ShoppingCart className="size-4" />, label: "Invoice", color: "text-green-500" },
  "purchase-draft": { icon: <Package className="size-4" />, label: "Purchase Draft", color: "text-orange-500" },
}

const moduleRoutes: Record<ArtifactType, string> = {
  report: "/reports",
  quotation: "/quotations",
  invoice: "/invoices",
  "purchase-draft": "/orders",
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}

export function ArtifactCard({ type, title, description, status = "draft", tag, timestamp }: ArtifactCardProps) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const router = useRouter()
  const cfg = config[type]

  const handleExport = useCallback(() => {
    const content = `# ${title}\n\n${description ?? ""}\n\nType: ${cfg.label}\nStatus: ${status}${tag ? `\nTag: ${tag}` : ""}${timestamp ? `\nCreated: ${new Date(timestamp).toLocaleString()}` : ""}`
    const blob = new Blob([content], { type: "text/markdown" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [title, description, cfg.label, status, tag, timestamp])

  const handleOpen = useCallback(() => {
    router.push(moduleRoutes[type])
  }, [router, type])

  return (
    <>
      <div className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">{cfg.icon}</span>
            <span className="text-sm font-medium text-foreground">{cfg.label}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {tag && (
              <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 text-muted-foreground/50 border-border/40">
                {tag}
              </Badge>
            )}
            <Badge variant="outline" className={cn(
              "text-xs font-medium px-2 py-0.5",
              status === "draft" && "text-muted-foreground/50 border-border/40",
              status === "pending" && "text-amber-500 border-amber-500/30",
              status === "completed" && "text-emerald-500 border-emerald-500/30",
            )}>
              {status}
            </Badge>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5" onClick={() => setPreviewOpen(true)}>
            <Eye className="size-3.5" />
            Preview
          </Button>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1.5 text-muted-foreground" onClick={handleExport}>
            <Download className="size-3.5" />
            Export
          </Button>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1.5 text-muted-foreground" onClick={handleOpen}>
            <ExternalLink className="size-3.5" />
            Open
          </Button>
        </div>
        {timestamp && (
          <p className="text-xs text-muted-foreground/50">
            {new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              <div className="space-y-3 mt-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">{cfg.label}</span>
                  <span className="text-muted-foreground/50">·</span>
                  <Badge variant="outline" className={cn(
                    "text-xs px-2 py-0",
                    status === "draft" && "text-muted-foreground/50",
                    status === "pending" && "text-amber-500",
                    status === "completed" && "text-emerald-500",
                  )}>{status}</Badge>
                  {tag && (
                    <Badge variant="outline" className="text-xs px-2 py-0 text-muted-foreground/50">{tag}</Badge>
                  )}
                </div>
                {description && (
                  <p className="text-sm text-foreground">{description}</p>
                )}
                {timestamp && (
                  <p className="text-xs text-muted-foreground/60">
                    Created: {new Date(timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}
