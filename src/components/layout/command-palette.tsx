"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { LayoutDashboard, Package, Layers3, ShoppingCart, Users, Receipt, Wallet, Truck, ClipboardList, Warehouse, BarChart3, Settings, Search, ArrowRight, X, User, Building2, FileText, ShoppingBag, ChevronRight, FolderTree, FileCheck, Banknote, MapPin, BookOpen, GraduationCap, FolderOpen, Calculator } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
 CommandDialog,
 CommandGroup,
 CommandInput,
 CommandItem,
 CommandList,
 CommandSeparator,
} from "@/components/ui/command"

type SearchResultItem = {
 id: string
 label: string
 sublabel?: string
 href: string
 image?: string
 fallback?: string
}

type GroupedResults = {
 products: SearchResultItem[]
 customers: SearchResultItem[]
 invoices: SearchResultItem[]
 orders: SearchResultItem[]
 suppliers: SearchResultItem[]
 categories: SearchResultItem[]
 quotations: SearchResultItem[]
 payments: SearchResultItem[]
 warehouses: SearchResultItem[]
 documents: SearchResultItem[]
 training: SearchResultItem[]
 wiki: SearchResultItem[]
 distributors: SearchResultItem[]
 deliveries: SearchResultItem[]
 stockCounts: SearchResultItem[]
}

const navItems = [
 { icon: LayoutDashboard, label: "Dashboard", href: "/" },
 { icon: Package, label: "Inventory", href: "/inventory" },
 { icon: Layers3, label: "Materials", href: "/materials" },
 { icon: ShoppingCart, label: "Orders", href: "/orders" },
 { icon: Users, label: "CRM", href: "/crm" },
 { icon: FileText, label: "Invoices", href: "/invoices" },
 { icon: Wallet, label: "Payments", href: "/payments" },
 { icon: Truck, label: "Suppliers", href: "/suppliers" },
 { icon: ClipboardList, label: "BOM", href: "/bom" },
 { icon: Warehouse, label: "Warehouses", href: "/warehouses" },
 { icon: BarChart3, label: "Reports", href: "/reports" },
 { icon: Settings, label: "Settings", href: "/settings" },
 { icon: Truck, label: "Distributors", href: "/distributors" },
 { icon: Package, label: "Deliveries", href: "/deliveries" },
 { icon: ClipboardList, label: "Stock Counts", href: "/stock-counts" },
]

const groupMeta: Record<string, { icon: React.ElementType; label: string; color: string }> = {
 products: { icon: Package, label: "Products", color: "text-primary bg-primary/10" },
 customers: { icon: Users, label: "Customers", color: "text-primary bg-primary/10" },
 invoices: { icon: FileText, label: "Invoices", color: "text-primary bg-primary/10" },
 orders: { icon: ShoppingCart, label: "Orders", color: "text-primary bg-primary/10" },
 suppliers: { icon: Truck, label: "Suppliers", color: "text-primary bg-primary/10" },
 categories: { icon: FolderTree, label: "Categories", color: "text-primary bg-primary/10" },
 quotations: { icon: FileCheck, label: "Quotations", color: "text-primary bg-primary/10" },
 payments: { icon: Banknote, label: "Payments", color: "text-primary bg-primary/10" },
 warehouses: { icon: MapPin, label: "Warehouses", color: "text-primary bg-primary/10" },
 documents: { icon: FolderOpen, label: "Documents", color: "text-primary bg-primary/10" },
 training: { icon: GraduationCap, label: "Training", color: "text-primary bg-primary/10" },
 wiki: { icon: BookOpen, label: "Wiki", color: "text-primary bg-primary/10" },
 distributors: { icon: Truck, label: "Distributors", color: "text-primary bg-primary/10" },
 deliveries: { icon: Package, label: "Deliveries", color: "text-primary bg-primary/10" },
 stockCounts: { icon: ClipboardList, label: "Stock Counts", color: "text-primary bg-primary/10" },
}

const groupKeys: (keyof GroupedResults)[] = ["products", "customers", "invoices", "orders", "suppliers", "categories", "quotations", "payments", "warehouses", "documents", "training", "wiki", "distributors", "deliveries", "stockCounts"]

async function fetchGroupedSearch(q: string): Promise<GroupedResults> {
 const empty: GroupedResults = { products: [], customers: [], invoices: [], orders: [], suppliers: [], categories: [], quotations: [], payments: [], warehouses: [], documents: [], training: [], wiki: [], distributors: [], deliveries: [], stockCounts: [] }
 if (!q.trim()) return empty
 try {
 const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
 if (!res.ok) return empty
 const data = await res.json()
 return {
 products: (data.products || []).map((p: any) => ({ id: p.id, label: p.name, sublabel: p.sku ? `SKU: ${p.sku}` : p.type, href: `/inventory/${p.id}` })),
 customers: (data.customers || []).map((c: any) => ({ id: c.id, label: c.name, sublabel: c.email || c.company, href: `/crm/${c.id}`, fallback: c.name?.[0] })),
 invoices: (data.invoices || []).map((inv: any) => ({ id: inv.id, label: inv.number, sublabel: `${inv.customerName || "Customer"} — $${inv.total?.toLocaleString() || "0"} · ${inv.status}`, href: `/invoices/${inv.id}` })),
 orders: (data.orders || []).map((o: any) => ({ id: o.id, label: o.number, sublabel: `${o.customerName || "Customer"} — $${o.total?.toLocaleString() || "0"} · ${o.status}`, href: `/orders/${o.id}` })),
 suppliers: (data.suppliers || []).map((s: any) => ({ id: s.id, label: s.name, sublabel: s.email || s.phone, href: `/suppliers/${s.id}`, fallback: s.name?.[0] })),
 categories: (data.categories || []).map((c: any) => ({ id: c.id, label: c.name, sublabel: c.description || "", href: `/categories/${c.id}` })),
 quotations: (data.quotations || []).map((q: any) => ({ id: q.id, label: q.number, sublabel: `${q.customerName || "Customer"} — ${q.status}`, href: `/quotations/${q.id}` })),
 payments: (data.payments || []).map((p: any) => ({ id: p.id, label: p.reference || p.id, sublabel: `฿${p.amount?.toLocaleString() || "0"} · ${p.method}`, href: `/payments/${p.id}` })),
 warehouses: (data.warehouses || []).map((w: any) => ({ id: w.id, label: w.name, sublabel: w.location || "", href: `/warehouses/${w.id}` })),
 documents: (data.documents || []).map((d: any) => ({ id: d.id, label: d.name, sublabel: d.type, href: `/knowledge/documents/${d.id}` })),
 training: (data.training || []).map((p: any) => ({ id: p.id, label: p.title, sublabel: p.type, href: `/knowledge/training/${p.id}` })),
 wiki: (data.wiki || []).map((a: any) => ({ id: a.id, label: a.title, sublabel: a.category, href: `/knowledge/wiki/${a.id}` })),
 distributors: (data.distributors || []).map((d: any) => ({ id: d.id, label: d.name, sublabel: d.territory || d.email, href: `/distributors/${d.id}`, fallback: d.name?.[0] })),
 deliveries: (data.deliveries || []).map((d: any) => ({ id: d.id, label: d.number, sublabel: `${d.distributorName || "Distributor"} · ${d.status}`, href: `/deliveries/${d.id}` })),
 stockCounts: (data.stockCounts || []).map((s: any) => ({ id: s.id, label: s.number, sublabel: `${s.warehouseName || "Warehouse"} · ${s.status}`, href: `/stock-counts/${s.id}` })),
 }
 } catch {
 return empty
 }
}

function groupHasItems(g: GroupedResults): boolean {
 return groupKeys.some((k) => g[k].length > 0)
}

function totalCount(g: GroupedResults): number {
 return groupKeys.reduce((sum, k) => sum + g[k].length, 0)
}

export function CommandPalette() {
 const router = useRouter()
 const [query, setQuery] = useState("")
 const [results, setResults] = useState<GroupedResults>({ products: [], customers: [], invoices: [], orders: [], suppliers: [], categories: [], quotations: [], payments: [], warehouses: [], documents: [], training: [], wiki: [], distributors: [], deliveries: [], stockCounts: [] })
 const [showDropdown, setShowDropdown] = useState(false)
 const [loading, setLoading] = useState(false)
 const [open, setOpen] = useState(false)
 const [modalQuery, setModalQuery] = useState("")
 const [modalResults, setModalResults] = useState<GroupedResults>({ products: [], customers: [], invoices: [], orders: [], suppliers: [], categories: [], quotations: [], payments: [], warehouses: [], documents: [], training: [], wiki: [], distributors: [], deliveries: [], stockCounts: [] })
 const [modalLoading, setModalLoading] = useState(false)
 const [modalExpanded, setModalExpanded] = useState(true)
 const ref = useRef<HTMLDivElement>(null)
 const inputRef = useRef<HTMLInputElement>(null)

 useEffect(() => {
 function handleClick(e: MouseEvent) {
 if (ref.current && !ref.current.contains(e.target as Node)) setShowDropdown(false)
 }
 document.addEventListener("mousedown", handleClick)
 return () => document.removeEventListener("mousedown", handleClick)
 }, [])

 useEffect(() => {
 const down = (e: KeyboardEvent) => {
 if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
 e.preventDefault()
 setOpen(true)
 }
 }
 document.addEventListener("keydown", down)
 return () => document.removeEventListener("keydown", down)
 }, [])

 useEffect(() => {
 if (!query.trim()) {
 setResults({ products: [], customers: [], invoices: [], orders: [], suppliers: [], categories: [], quotations: [], payments: [], warehouses: [], documents: [], training: [], wiki: [], distributors: [], deliveries: [], stockCounts: [] })
 setShowDropdown(false)
 return
 }
 setShowDropdown(true)
 setLoading(true)
 const timer = setTimeout(async () => {
 const items = await fetchGroupedSearch(query)
 if (query.trim()) {
 setResults(items)
 setLoading(false)
 }
 }, 100)
 return () => clearTimeout(timer)
 }, [query])

 useEffect(() => {
 if (!modalQuery.trim()) { setModalResults({ products: [], customers: [], invoices: [], orders: [], suppliers: [], categories: [], quotations: [], payments: [], warehouses: [], documents: [], training: [], wiki: [], distributors: [], deliveries: [], stockCounts: [] }); return }
 setModalLoading(true)
 const timer = setTimeout(async () => {
 const items = await fetchGroupedSearch(modalQuery)
 if (modalQuery.trim()) {
 setModalResults(items)
 setModalLoading(false)
 }
 }, 100)
 return () => clearTimeout(timer)
 }, [modalQuery])

 const handleSelect = useCallback((href: string) => {
 setQuery("")
 setShowDropdown(false)
 router.push(href)
 }, [router])

 const handleModalSelect = useCallback((href: string) => {
 setOpen(false)
 setModalQuery("")
 router.push(href)
 }, [router])

 const filteredNav = query.trim()
 ? navItems.filter((n) => n.label.toLowerCase().includes(query.toLowerCase()))
 : []

 const showPages = query.trim() && filteredNav.length > 0

 const filteredModalNav = modalQuery.trim()
 ? navItems.filter((n) => n.label.toLowerCase().includes(modalQuery.toLowerCase()))
 : []

 const showModalPages = modalQuery.trim() && filteredModalNav.length > 0

 const modalHasItems = groupHasItems(modalResults)
 const modalCount = totalCount(modalResults)

 function renderGroupItems(group: GroupedResults, onSelect: (href: string) => void) {
 return (
 <>
 {groupKeys.map((key) => {
 const items = group[key]
 if (items.length === 0) return null
 const meta = groupMeta[key]
 const Icon = meta.icon
 return (
 <div key={key}>
 <div className="flex items-center gap-2 px-4 pt-3 pb-1">
 <Icon className="w-3.5 h-3.5 text-muted-foreground" />
 <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{meta.label}</p>
 </div>
 {items.map((item) => (
 <button
 key={`${key}-${item.id}`}
 onClick={() => onSelect(item.href)}
 className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted/50 transition-colors"
 >
 {item.image || key === "customers" || key === "suppliers" ? (
 <Avatar className="size-7 shrink-0 ring-1 ring-slate-200">
 <AvatarImage src={item.image || undefined} alt={item.label} />
 <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">{item.fallback || item.label[0]}</AvatarFallback>
 </Avatar>
 ) : (
 <div className="size-7 shrink-0 rounded-md bg-muted flex items-center justify-center">
 <Icon className="w-3.5 h-3.5 text-muted-foreground" />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
 {item.sublabel && (
 <p className="text-xs text-muted-foreground truncate">{item.sublabel}</p>
 )}
 </div>
 <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${meta.color}`}>
 {meta.label.slice(0, -1)}
 </span>
 </button>
 ))}
 </div>
 )
 })}
 </>
 )
 }

 return (
 <>
 <div ref={ref} className="relative w-full max-w-lg">
 <div className="flex items-center gap-2 h-9 px-3 rounded-xl border border-border/60 bg-surface/80 focus-within:border-primary/40 focus-within:bg-white focus-within:shadow-sm transition-all duration-150">
 <input
 ref={inputRef}
 type="text"
 value={query}
 onChange={(e) => setQuery(e.target.value)}
 onFocus={() => { if (groupHasItems(results) || filteredNav.length > 0) setShowDropdown(true) }}
 placeholder="Search products, customers, documents..."
 className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none min-w-0"
 />
 {query && (
 <button onClick={() => { setQuery(""); inputRef.current?.focus() }} className="flex items-center justify-center size-5 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-surface transition-colors">
 </button>
 )}
 <kbd className="shrink-0 inline-flex h-5 items-center rounded-md border border-border bg-white px-1.5 font-[inherit] text-[10px] font-medium text-muted-foreground/60">
 ⌘K
 </kbd>
 </div>

 {showDropdown && (
 <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border rounded-2xl shadow-[0_8px_40px_-8px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.04)] z-50 overflow-hidden animate-scale-in origin-top max-h-[70vh] overflow-y-auto">
 {loading ? (
 <div className="px-4 py-3 border-b border-border">
 <span className="text-sm text-muted-foreground">Searching...</span>
 </div>
 ) : (
 renderGroupItems(results, handleSelect)
 )}

 {!loading && showPages && (
 <div className={cn(groupHasItems(results) && "border-t border-slate-100")}>
 <div className="flex items-center gap-2 px-4 pt-3 pb-1">
 <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pages</p>
 </div>
 {filteredNav.map((item) => (
 <button
 key={item.href}
 onClick={() => handleSelect(item.href)}
 className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-muted/50 transition-colors"
 >
 <div className="size-7 shrink-0 rounded-md bg-muted flex items-center justify-center">
 </div>
 <p className="text-sm font-medium text-slate-900">{item.label}</p>
 </button>
 ))}
 </div>
 )}

 {!loading && !groupHasItems(results) && !showPages && (
 <div className="flex flex-col items-center py-8 text-center px-4">
 <div className="size-10 rounded-xl bg-muted flex items-center justify-center mb-2">
 </div>
 <p className="text-sm text-muted-foreground">No results for &quot;{query}&quot;</p>
 <p className="text-xs text-muted-foreground mt-0.5">Try searching for products, customers, or documents</p>
 </div>
 )}
 </div>
 )}
 </div>

 <CommandDialog open={open} onOpenChange={setOpen}>
 <CommandInput
 placeholder="Search products, customers, documents..."
 value={modalQuery}
 onValueChange={setModalQuery}
 />
 <CommandList>
 {modalLoading && (
 <div className="flex items-center justify-center py-8">
 <div className="size-5 rounded-full border-2 border-border border-t-primary animate-spin" />
 </div>
 )}

 {!modalLoading && modalQuery && !modalHasItems && !showModalPages && (
 <div className="flex flex-col items-center py-8 text-center px-4">
 <div className="size-10 rounded-xl bg-muted flex items-center justify-center mb-2">
 </div>
 <p className="text-sm text-muted-foreground">No results for &ldquo;{modalQuery}&rdquo;</p>
 <p className="text-xs text-muted-foreground mt-0.5">Try searching for products, customers, or documents</p>
 </div>
 )}

 {!modalLoading && modalHasItems && (
 <>
 <div className="px-4 py-2.5 border-b border-border">
 <div className="flex items-center gap-2">
 <button
 onClick={() => setModalExpanded((v) => !v)}
 className="flex items-center gap-2"
 >
 <ChevronRight
 className={cn(
 "w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform duration-150",
 modalExpanded && "rotate-90",
 )}
 />
 <span className="text-sm font-medium text-muted-foreground">
 Found {modalCount} result{modalCount === 1 ? "" : "s"}
 </span>
 </button>
 </div>
 </div>
 {modalExpanded && (
 <div className="border-b border-slate-50">
 <div className="flex items-center gap-2 px-4 py-1.5">
 <span className="text-xs text-muted-foreground font-medium">Searched for</span>
 <span className="text-xs text-muted-foreground truncate">&ldquo;{modalQuery}&rdquo;</span>
 </div>
 <div className="flex flex-col">
 {groupKeys.map((key) => {
 const items = modalResults[key]
 if (items.length === 0) return null
 const meta = groupMeta[key]
 const Icon = meta.icon
 return (
 <CommandGroup key={key} heading={meta.label}>
 {items.map((item) => (
 <CommandItem key={`${key}-${item.id}`} onSelect={() => handleModalSelect(item.href)}>
 {item.image || key === "customers" || key === "suppliers" ? (
 <Avatar className="size-6 shrink-0 ring-1 ring-slate-200">
 <AvatarImage src={item.image || undefined} alt={item.label} />
 <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">{item.fallback || item.label[0]}</AvatarFallback>
 </Avatar>
 ) : (
 <Icon className="w-4 h-4 text-muted-foreground" />
 )}
 <div className="flex-1 min-w-0">
 <span className="text-sm">{item.label}</span>
 {item.sublabel && (
 <span className="text-xs text-muted-foreground ml-2">{item.sublabel}</span>
 )}
 </div>
 <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${meta.color}`}>
 {meta.label.slice(0, -1)}
 </span>
 </CommandItem>
 ))}
 </CommandGroup>
 )
 })}
 </div>
 </div>
 )}
 </>
 )}

 {showModalPages && (
 <>
 <CommandSeparator />
 <CommandGroup heading="Pages">
 {filteredModalNav.map((item) => (
 <CommandItem key={item.href} onSelect={() => handleModalSelect(item.href)}>
 <span>{item.label}</span>
 </CommandItem>
 ))}
 </CommandGroup>
 </>
 )}

 {!modalQuery && (
 <>
 <CommandSeparator />
 <CommandGroup heading="Pages">
 {navItems.map((item) => {
 const Icon = item.icon
 return (
 <CommandItem key={item.href} onSelect={() => handleModalSelect(item.href)}>
 <Icon className="w-4 h-4" />
 <span>{item.label}</span>
 </CommandItem>
 )
 })}
 </CommandGroup>
 </>
 )}
 </CommandList>
 </CommandDialog>
 </>
 )
}
