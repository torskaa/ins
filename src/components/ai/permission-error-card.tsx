"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"

interface PermissionErrorCardProps {
  message?: string
}

export function PermissionErrorCard({ message }: PermissionErrorCardProps) {
  return (
    <Card className="border-warning/30 bg-warning/5">
      <CardContent className="p-3.5 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Your account cannot access this data</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {message || "You don't have the required permissions to view this information. Contact your workspace admin to request access."}
          </p>
          <button
            className="mt-2.5 px-3 py-1.5 rounded-lg bg-warning/10 text-warning text-xs font-medium hover:bg-warning/20 transition-colors"
            onClick={() => {
              // Presentational only — no backend call
            }}
          >
            Request Access
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
