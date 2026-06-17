"use client"

import { Settings2 } from "lucide-react"
import {
 DropdownMenu,
 DropdownMenuCheckboxItem,
 DropdownMenuContent,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface PropertyOption {
 key: string
 label: string
}

interface PropertySelectorProps {
 options: PropertyOption[]
 selected: string[]
 onChange: (selected: string[]) => void
}

export function PropertySelector({ options, selected, onChange }: PropertySelectorProps) {
 function toggle(key: string) {
 if (selected.includes(key)) {
 onChange(selected.filter((k) => k !== key))
 } else {
 onChange([...selected, key])
 }
 }

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground transition-colors">
 <Settings2 className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">Properties</span>
 {selected.length < options.length && (
 <span className="text-[10px] text-muted-foreground font-mono ml-0.5">
 {selected.length}/{options.length}
 </span>
 )}
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="min-w-[170px]">
 {options.map((opt) => (
 <DropdownMenuCheckboxItem
 key={opt.key}
 checked={selected.includes(opt.key)}
 onCheckedChange={() => toggle(opt.key)}
 >
 {opt.label}
 </DropdownMenuCheckboxItem>
 ))}
 </DropdownMenuContent>
 </DropdownMenu>
 )
}
