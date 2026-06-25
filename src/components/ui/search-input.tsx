"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = "Search...", className }: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground" />
      <Input
        placeholder={placeholder}
        className="pl-10 h-9 w-full rounded-md"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
