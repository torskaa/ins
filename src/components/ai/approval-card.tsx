"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertOctagon, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

interface ApprovalCardProps {
  runId: string
  toolName: string
  input: Record<string, unknown>
  reason: string
  status: "pending" | "approved" | "denied"
  onResolved?: () => void
}

export function ApprovalCard({
  runId,
  toolName,
  input,
  reason,
  status,
  onResolved,
}: ApprovalCardProps) {
  const [resolving, setResolving] = useState(false)
  const handleResolve = async (approved: boolean) => {
    setResolving(true)
    try {
      const res = await fetch("/api/ai/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, approved }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to resolve approval" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      if (approved) {
        toast.success("Approved", { description: "The action has been approved and will proceed." })
      } else {
        toast.warning("Denied", { description: "The action has been denied and will not proceed." })
      }
      onResolved?.()
    } catch (error) {
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to resolve approval",
      })
    } finally {
      setResolving(false)
    }
  }

  if (status !== "pending") {
    const isApproved = status === "approved"
    return (
      <Card className="border-l-4 border-l-muted">
        <CardContent className="p-4 flex items-center gap-3">
          {isApproved ? (
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 text-destructive shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">
              {isApproved ? "Approved" : "Denied"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isApproved
                ? `"${toolName}" was approved`
                : `"${toolName}" was denied`}
            </p>
          </div>
          <Badge variant={isApproved ? "success" : "destructive"} className="ml-auto shrink-0">
            {status}
          </Badge>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-l-4 border-l-warning">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <CardTitle className="text-sm font-medium">Approval Required</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{reason}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Tool:</span>
          <span className="text-xs font-mono">{toolName}</span>
        </div>
        {input && Object.keys(input).length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Input</span>
            <pre className="mt-1 text-xs bg-muted rounded p-2 overflow-x-auto">{JSON.stringify(input, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2 pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleResolve(false)}
          disabled={resolving}
        >
          <XCircle className="w-4 h-4 mr-1.5" />
          Deny
        </Button>
        <Button
          size="sm"
          onClick={() => handleResolve(true)}
          disabled={resolving}
        >
          <CheckCircle2 className="w-4 h-4 mr-1.5" />
          {resolving ? "Approving..." : "Approve"}
        </Button>
      </CardFooter>
    </Card>
  )
}
