"use client"

import type { ReactNode } from "react"
import { SkeletonTable, SkeletonDetail, SkeletonForm } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { AlertTriangle, RefreshCw } from "lucide-react"

interface PageShellProps {
  title: string
  description?: string
  actions?: ReactNode
  loading: boolean
  error: string | null
  empty: boolean
  emptyState?: ReactNode
  onRetry?: () => void
  children: ReactNode
  variant?: "list" | "detail" | "form"
  className?: string
}

export function PageShell({
  title,
  description,
  actions,
  loading,
  error,
  empty,
  emptyState,
  onRetry,
  children,
  variant = "list",
  className = "",
}: PageShellProps) {
  const skeleton = {
    list: <SkeletonTable rows={6} columns={4} />,
    detail: <SkeletonDetail />,
    form: <SkeletonForm />,
  }[variant]

  const errorState = error ? (
    <EmptyState
      variant="error"
      title="Failed to load data"
      description={error}
      icons={<AlertTriangle className="size-5" />}
      actions={[
        {
          label: "Try again",
          onClick: onRetry || (() => window.location.reload()),
          icon: <RefreshCw className="size-3.5" />,
        },
      ]}
    />
  ) : null

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {error ? errorState : loading ? skeleton : empty ? emptyState : children}
    </div>
  )
}
