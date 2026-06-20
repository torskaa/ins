import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonTable({ rows = 6, columns = 4, className }: { rows?: number; columns?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card shadow-sm", className)}>
      <div className="p-5 space-y-3">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-3">
            {Array.from({ length: columns }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn("h-5", c === 0 ? "w-1/3" : c === 1 ? "w-1/4" : c === columns - 1 ? "w-16 ml-auto" : "w-20")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function SkeletonCard({ className, contentClassName, children }: { className?: string; contentClassName?: string; children?: React.ReactNode }) {
  if (children) {
    return <div className={cn("rounded-xl border bg-card shadow-sm", className)}>{children}</div>
  }
  return (
    <div className={cn("rounded-xl border bg-card shadow-sm p-5", className)}>
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="w-5 h-5 rounded" />
        <Skeleton className="h-5 w-32" />
      </div>
      <div className={cn("space-y-2", contentClassName)}>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

function SkeletonKPICard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card shadow-sm p-5", className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="w-4 h-4 rounded" />
      </div>
      <Skeleton className="h-7 w-24 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

function SkeletonChart({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card shadow-sm", className)}>
      <div className="p-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-5 w-36 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="w-8 h-8 rounded" />
        </div>
      </div>
      <div className="p-5 pt-0">
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
  )
}

function SkeletonDetail({ cards = 4, hasChart = false }: { cards?: number; hasChart?: boolean }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="w-8 h-8 rounded-lg" />
        <div>
          <Skeleton className="h-5 w-24 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <div>
          <Skeleton className="h-6 w-48 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="w-3.5 h-3.5 rounded" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-5 w-20" />
          </div>
        ))}
      </div>
      {hasChart && (
        <div className="rounded-xl border bg-card shadow-sm p-5">
          <Skeleton className="h-5 w-32 mb-4" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      )}
    </div>
  )
}

function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-5 animate-fade-in">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-48" />
      <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>
    </div>
  )
}

function SkeletonPageHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <Skeleton className="h-7 w-40 mb-1" />
        <Skeleton className="h-4 w-60" />
      </div>
      <Skeleton className="h-9 w-28 rounded-lg" />
    </div>
  )
}

function SkeletonText({ lines = 2, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  )
}

export { Skeleton, SkeletonTable, SkeletonCard, SkeletonKPICard, SkeletonChart, SkeletonDetail, SkeletonForm, SkeletonPageHeader, SkeletonText }
