"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
 CommandDialog,
 CommandEmpty,
 CommandGroup,
 CommandInput,
 CommandItem,
 CommandList,
} from "@/components/ui/command"
import { Package, ShoppingCart, FileText, Users, FileSpreadsheet, Truck, Briefcase, Building2, Plus } from "lucide-react"

const createActions = [
 { id: "product", icon: Package, label: "New Product", description: "Add a product to inventory", shortcut: "C then P" },
 { id: "order", icon: ShoppingCart, label: "New Order", description: "Create a sales order", shortcut: "C then O" },
 { id: "invoice", icon: FileText, label: "New Invoice", description: "Generate an invoice", shortcut: "C then I" },
 { id: "customer", icon: Users, label: "New Customer", description: "Add a customer to CRM", shortcut: "C then C" },
 { id: "quotation", icon: FileSpreadsheet, label: "New Quotation", description: "Create a price quotation", shortcut: "C then Q" },
 { id: "supplier", icon: Building2, label: "New Supplier", description: "Add a new supplier", shortcut: "C then S" },
 { id: "project", icon: Briefcase, label: "New Project", description: "Start a new project", shortcut: "C then J" },
 { id: "delivery", icon: Truck, label: "New Delivery", description: "Schedule a delivery", shortcut: "C then D" },
]

export function QuickCreate() {
 const router = useRouter()
 const [open, setOpen] = useState(false)

 function handleSelect(id: string) {
 setOpen(false)
 switch (id) {
 case "product":
 router.push("/inventory/new")
 break
 case "order":
 router.push("/orders/new")
 break
 case "invoice":
 router.push("/invoices/new")
 break
 case "customer":
 router.push("/crm/new")
 break
 case "quotation":
 router.push("/quotations/new")
 break
 case "supplier":
 router.push("/suppliers/new")
 break
 case "project":
 router.push("/projects/new")
 break
 case "delivery":
 router.push("/deliveries/new")
 break
 }
 }

 return (
 <>
 <button
 onClick={() => setOpen(true)}
 className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium rounded-lg border border-border/50 bg-surface/80 text-muted-foreground hover:text-foreground hover:bg-surface hover:border-primary/30 transition-all duration-150"
 >
 <span className="hidden sm:inline">Quick Create</span>
 </button>
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
 </CommandItem>
 )
 })}
 </CommandGroup>
 </CommandList>
 </CommandDialog>
 </>
 )
}
