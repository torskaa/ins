"use client"

import { cn } from "@/lib/utils"
import { Package, ShoppingCart, BarChart3, Users } from "lucide-react"

const contexts = [
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "finance", label: "Finance", icon: BarChart3 },
  { id: "crm", label: "CRM", icon: Users },
]

interface CopilotContextBarProps {
  activeContext: string | null
  onSelectContext: (context: string | null) => void
}

export function CopilotContextBar({ activeContext, onSelectContext }: CopilotContextBarProps) {
  return (
    <div className="flex items-center gap-1">
      {contexts.map((ctx) => {
        const Icon = ctx.icon
        const isActive = activeContext === ctx.id
        return (
          <button
            key={ctx.id}
            onClick={() => onSelectContext(isActive ? null : ctx.id)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all",
              isActive
                ? "bg-accent/50 text-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/30",
            )}
          >
            <Icon className="size-3.5" />
            {ctx.label}
          </button>
        )
      })}
      {activeContext && (
        <button
          onClick={() => onSelectContext(null)}
          className="ml-1 text-xs text-muted-foreground/50 hover:text-muted-foreground px-1"
        >
          Clear
        </button>
      )}
    </div>
  )
}
