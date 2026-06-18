"use client"

import { useMemo } from "react"
import { ListFilter } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"

export interface FilterColumn {
  key: string
  label: string
  getValue: (item: any) => string
}

interface FilterButtonProps {
  filters: Record<string, string | null>
  onChange: (key: string, value: string | null) => void
  columns: FilterColumn[]
  data: any[]
}

export function FilterButton({ filters, onChange, columns, data }: FilterButtonProps) {
  const activeCount = Object.values(filters).filter(Boolean).length

  const columnGroups = useMemo(() => {
    return columns.map((col) => {
      const values = new Set<string>()
      data.forEach((item) => {
        const v = col.getValue(item)
        if (v) values.add(v)
      })
      return {
        key: col.key,
        label: col.label,
        active: !!filters[col.key],
        options: Array.from(values).sort(),
      }
    })
  }, [columns, data, filters])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ListFilter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {activeCount > 0 ? `Filter (${activeCount})` : "Filter"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        {columnGroups.map((col) => (
          <DropdownMenuSub key={col.key}>
            <DropdownMenuSubTrigger>
              {col.label}
              {col.active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => onChange(col.key, null)}>
                Any
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {col.options.map((opt) => (
                <DropdownMenuItem
                  key={opt}
                  onClick={() => onChange(col.key, opt)}
                  className={filters[col.key] === opt ? "bg-accent" : ""}
                >
                  {opt}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ))}
        {activeCount > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              Object.keys(filters).forEach((k) => onChange(k, null))
            }}>
              Clear all filters
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
