"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ShoppingCart, FileSignature, Package, Download, ExternalLink, Eye } from "lucide-react"

type ArtifactType = "report" | "quotation" | "invoice" | "purchase-draft"

interface ArtifactCardProps {
  type: ArtifactType
  title: string
  description?: string
  status?: "draft" | "pending" | "completed"
  timestamp?: Date
}

const config: Record<ArtifactType, { icon: React.ReactNode; label: string; color: string }> = {
  report: { icon: <FileText className="size-4" />, label: "Report", color: "text-blue-500" },
  quotation: { icon: <FileSignature className="size-4" />, label: "Quotation", color: "text-purple-500" },
  invoice: { icon: <ShoppingCart className="size-4" />, label: "Invoice", color: "text-green-500" },
  "purchase-draft": { icon: <Package className="size-4" />, label: "Purchase Draft", color: "text-orange-500" },
}

export function ArtifactCard({ type, title, description, status = "draft", timestamp }: ArtifactCardProps) {
  const cfg = config[type]

  return (
    <Card className="overflow-hidden border-border/40 shadow-sm rounded-lg">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20 bg-muted/10">
        <div className="flex items-center gap-2">
          <span className={cfg.color}>{cfg.icon}</span>
          <span className="text-sm font-medium">{cfg.label}</span>
        </div>
        <Badge variant="outline" className={cn(
          "text-xs font-medium px-2 py-0.5",
          status === "draft" && "text-muted-foreground border-border/40",
          status === "pending" && "text-amber-500 border-amber-500/20",
          status === "completed" && "text-success border-success/20",
        )}>
          {status}
        </Badge>
      </div>
      <CardContent className="p-4 space-y-3">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs gap-1.5">
            <Eye className="size-3.5" />
            Preview
          </Button>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1.5 text-muted-foreground">
            <Download className="size-3.5" />
            Export
          </Button>
          <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs gap-1.5 text-muted-foreground">
            <ExternalLink className="size-3.5" />
            Open
          </Button>
        </div>
        {timestamp && (
          <p className="text-xs text-muted-foreground/50">
            {new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
