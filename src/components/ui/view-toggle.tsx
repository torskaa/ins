"use client"

import { LayoutGrid, List } from "lucide-react"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuRadioGroup,
 DropdownMenuRadioItem,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ViewToggleProps {
 view: "cards" | "rows"
 onChange: (view: "cards" | "rows") => void
}

export function ViewToggle({ view, onChange }: ViewToggleProps) {
 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
 <button className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm text-muted-foreground hover:text-foreground transition-colors">
 {view === "cards" ? (
 <LayoutGrid className="w-3.5 h-3.5" />
 ) : (
 <List className="w-3.5 h-3.5" />
 )}
 <span className="hidden sm:inline">{view === "cards" ? "Cards" : "Rows"}</span>
 </button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end">
 <DropdownMenuRadioGroup value={view} onValueChange={(v) => onChange(v as "cards" | "rows")}>
 <DropdownMenuRadioItem value="cards">
 <LayoutGrid className="w-3.5 h-3.5 mr-2" />
 Cards
 </DropdownMenuRadioItem>
 <DropdownMenuRadioItem value="rows">
 <List className="w-3.5 h-3.5 mr-2" />
 Rows
 </DropdownMenuRadioItem>
 </DropdownMenuRadioGroup>
 </DropdownMenuContent>
 </DropdownMenu>
 )
}
