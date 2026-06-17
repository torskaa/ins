"use client"

import { useState } from "react"
import { motion, LazyMotion, domAnimation, type Variants } from "framer-motion"
import { cn } from "@/lib/utils"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/ui/empty-state"
import { SkeletonTable } from "@/components/ui/skeleton"
import { cva } from "class-variance-authority"
import type { ReactNode } from "react"

export interface Column<T> {
 key: string
 label: string
 render?: (item: T) => ReactNode
 className?: string
 cellClassName?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  searchable?: boolean
  searchPlaceholder?: string
  toolbar?: ReactNode
  onRowClick?: (item: T) => void
  loading?: boolean
  compact?: boolean
  empty?: { icon?: ReactNode; icons?: ReactNode[]; title: string; description?: string; action?: { label: string; onClick: () => void } }
  pagination?: { pageSize?: number; total?: number }
  className?: string
  noBorder?: boolean
}

const tableVariants: Variants = {
 hidden: { opacity: 0, y: 12 },
 visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const rowVariants: Variants = {
 hidden: { opacity: 0, y: 16, scale: 0.98 },
 visible: (i: number) => ({
 opacity: 1,
 y: 0,
 scale: 1,
 transition: { delay: i * 0.04, duration: 0.35 },
 }),
}

export const statusBadge = cva("inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium capitalize", {
 variants: {
 variant: {
 default: "bg-primary/10 text-primary-dark",
 secondary: "bg-secondary/15 text-secondary-dark",
 success: "bg-success/15 text-success",
 destructive: "bg-destructive/15 text-destructive",
 warning: "bg-warning/15 text-amber-700",
 outline: "border border-border text-muted-foreground",
 },
 },
 defaultVariants: { variant: "default" },
})

export function DataTable<T extends { id: string }>({
 columns,
 data,
  searchable,
  searchPlaceholder = "Search...",
  toolbar,
  onRowClick,
  loading,
  compact,
  empty,
  pagination,
  className,
  noBorder,
}: DataTableProps<T>) {
  const [page, setPage] = useState(1)
  const pageSize = pagination?.pageSize || (compact ? 50 : 20)
  const total = pagination?.total || data.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const [search, setSearch] = useState("")

 const filtered = (search
 ? data.filter((item) =>
 Object.values(item as any).some(
 (val) => val && String(val).toLowerCase().includes(search.toLowerCase())
 )
 )
 : data).slice(0, pagination ? pageSize : undefined)

 if (loading) {
 return <SkeletonTable rows={6} columns={columns.length} className={className} />
 }

 if (data.length === 0 && empty) {
 return (
 <EmptyState
 icons={empty.icons}
 title={empty.title}
 description={empty.description}
 actions={empty.action ? [empty.action] : undefined}
 className={className}
 />
 )
 }

 return (
 <LazyMotion features={domAnimation}>
 <motion.div className={cn("space-y-4", className)} variants={tableVariants} initial="hidden" animate="visible">
 {(searchable || toolbar) && (
 <div className="flex items-center gap-3">
 {searchable && (
 <div className="relative flex-1 max-w-sm">
 <Input
 placeholder={searchPlaceholder}
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 className="pl-9 h-9"
 />
 </div>
 )}
 {toolbar && <div className="flex items-center gap-2 ml-auto">{toolbar}</div>}
 </div>
 )}
  <div className={cn("rounded-xl border border-border overflow-hidden", className)}>
  <div className="relative w-full overflow-auto">
  <table className={cn("w-full caption-bottom", compact ? "text-xs" : "text-sm")}>
  <thead>
  <tr className={cn("border-b", compact && "bg-muted/30")}>
  {columns.map((col) => (
  <th
  key={col.key}
  className={cn(
  compact ? "h-9 px-2.5 text-[10px] uppercase tracking-wider" : "h-12 px-4",
  "text-left align-middle font-medium text-muted-foreground",
  col.className
  )}
  >
  {col.label}
  </th>
  ))}
  </tr>
  </thead>
  <tbody>
  {filtered.map((item, index) => (
  <motion.tr
  key={item.id}
  custom={index}
  initial="hidden"
  animate="visible"
  variants={rowVariants}
  className={cn(
  "border-b transition-colors hover:bg-muted/50 last:border-0",
  onRowClick && "cursor-pointer"
  )}
  onClick={() => onRowClick?.(item)}
  >
  {columns.map((col) => (
  <td key={col.key} className={cn(compact ? "p-2.5" : "p-4", "align-middle", col.cellClassName)}>
  {col.render ? col.render(item) : String((item as any)[col.key] ?? "")}
  </td>
  ))}
  </motion.tr>
  ))}
  {filtered.length === 0 && !empty && (
  <tr>
  <td colSpan={columns.length} className={cn("text-center text-muted-foreground", compact ? "h-16 text-xs" : "h-32 text-sm")}>
  No results found.
  </td>
  </tr>
  )}
  </tbody>
  </table>
  </div>
 {pagination && totalPages > 1 && (
 <div className="flex items-center justify-between px-4 py-3 border-t border-border">
 <p className="text-xs text-muted-foreground">
 Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, total)} of {total}
 </p>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setPage(Math.max(1, page - 1))}
 disabled={page <= 1}
 className="px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
 >
 Prev
 </button>
 {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
 const p = totalPages <= 7 ? i + 1 : Math.max(1, Math.min(page - 3, totalPages - 6)) + i
 return (
 <button
 key={p}
 onClick={() => setPage(p)}
 className={cn(
 "px-2 py-1 text-xs rounded border",
 p === page ? "bg-primary text-white border-primary" : "border-border hover:bg-muted"
 )}
 >
 {p}
 </button>
 )
 })}
 <button
 onClick={() => setPage(Math.min(totalPages, page + 1))}
 disabled={page >= totalPages}
 className="px-2 py-1 text-xs rounded border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed"
 >
 Next
 </button>
 </div>
 </div>
 )}
 </div>
 </motion.div>
 </LazyMotion>
 )
}
