"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { useHotkey } from "@/hooks/use-hotkey"
import {
  Package,
  ShoppingCart,
  FileText,
  Users,
  FileSpreadsheet,
  Truck,
  Briefcase,
  Building2,
  Plus,
  Layers,
  GitBranch,
} from "lucide-react"

const createActions = [
  { id: "material", icon: Layers, label: "New Material", shortcut: "M", route: "/materials/new" },
  { id: "product", icon: Package, label: "New Product", shortcut: "P", route: "/inventory/new" },
  { id: "bom", icon: GitBranch, label: "New BOM", shortcut: "B", route: "/bom/new" },
  { id: "order", icon: ShoppingCart, label: "New Order", shortcut: "O", route: "/orders/new" },
  { id: "invoice", icon: FileText, label: "New Invoice", shortcut: "I", route: "/invoices/new" },
  { id: "customer", icon: Users, label: "New Customer", shortcut: "C", route: "/crm/new" },
  { id: "quotation", icon: FileSpreadsheet, label: "New Quotation", shortcut: "Q", route: "/quotations/new" },
  { id: "supplier", icon: Building2, label: "New Supplier", shortcut: "S", route: "/suppliers/new" },
  { id: "project", icon: Briefcase, label: "New Project", shortcut: "J", route: "/projects/new" },
  { id: "delivery", icon: Truck, label: "New Delivery", shortcut: "D", route: "/deliveries/new" },
]

const shortcutMap = Object.fromEntries(
  createActions.map((a) => [a.shortcut.toLowerCase(), a.id]),
)

const routeMap = Object.fromEntries(
  createActions.map((a) => [a.id, a.route]),
)

export function QuickCreate() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen((prev) => !prev), [])

  useHotkey("Enter", toggle)

  function handleSelect(id: string) {
    setOpen(false)
    const route = routeMap[id]
    if (route) router.push(route)
  }

  useEffect(() => {
    if (!open) return

    function handleKeyDown(e: KeyboardEvent) {
      const key = e.key.toLowerCase()
      const actionId = shortcutMap[key]
      if (actionId) {
        e.preventDefault()
        e.stopPropagation()
        handleSelect(actionId)
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
  }, [open])

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="h-8 gap-1.5 text-xs shadow-sm">
        <span className="hidden sm:inline">Quick Create</span>
        <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="What do you want to create?" />
        <CommandList>
          <CommandEmpty>No actions found.</CommandEmpty>
          <CommandGroup heading="Create">
            {createActions.map((action) => {
              const Icon = action.icon
              return (
                <CommandItem key={action.id} onSelect={() => handleSelect(action.id)}>
                  <Icon className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span>{action.label}</span>
                    <span className="text-xs text-muted-foreground">{action.description}</span>
                  </div>
                  <kbd className="ml-auto text-xs text-muted-foreground">{action.shortcut}</kbd>
                </CommandItem>
              )
            })}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
