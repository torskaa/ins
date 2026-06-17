"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import WorkspaceSwitcher from "@/components/workspace/workspace-switcher"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import {
 LayoutDashboard,
 Package,
 ShoppingCart,
 Users,
 FileText,
 Receipt,
 BarChart3,
 Settings,
 ChevronLeft,
 Truck,
 Tags,
 Warehouse,
 FileSignature,
 GitBranch,
 Layers3,
 Layers,
 TrendingUp,
 BookOpen,
 GraduationCap,
 FolderOpen,
 ChevronDown,
 Moon,
 Sun,
 ClipboardList,
 Factory,
 Wrench,
 Activity,
 FolderKanban,
 Percent,
 Shield,
 Building2,
 Link2,
} from "lucide-react"

type SubMenuItem = { label: string; href: string; icon?: any }
type MenuItem = {
 label: string
 href?: string
 icon?: any
 submenu?: SubMenuItem[]
}

const menuGroups: { label: string; items: MenuItem[] }[] = [
 {
 label: "Main",
 items: [
 { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
 { label: "Inventory", href: "/inventory", icon: Package },
 { label: "Stock Movements", href: "/stock-movements", icon: Activity },
 { label: "Materials", href: "/materials", icon: GitBranch },
 { label: "Orders", href: "/orders", icon: ShoppingCart },
 { label: "CRM", href: "/crm", icon: Users },
 ],
 },
 {
 label: "Knowledge",
 items: [
 {
 label: "Knowledge Hub", icon: BookOpen,
 submenu: [
 { label: "Wiki", href: "/knowledge/wiki", icon: BookOpen },
 { label: "Training Hub", href: "/knowledge/training", icon: GraduationCap },
 { label: "Document Center", href: "/knowledge/documents", icon: FolderOpen },
 ],
 },
 ],
 },
 {
 label: "Sales",
 items: [
 { label: "Quotations", href: "/quotations", icon: FileSignature },
 { label: "Invoices", href: "/invoices", icon: FileText },
 { label: "Payments", href: "/payments", icon: Receipt },
 ],
 },
 {
 label: "Procurement",
 items: [
 { label: "Suppliers", href: "/suppliers", icon: Truck },
 { label: "Purchase Orders", href: "/orders?type=purchase", icon: ShoppingCart },
 { label: "Bill of Materials", href: "/bom", icon: Layers3 },
 { label: "Warehouses", href: "/warehouses", icon: Warehouse },
 ],
 },
 {
 label: "Distribution",
 items: [
 { label: "Distributors", href: "/distributors", icon: Truck },
 { label: "Deliveries", href: "/deliveries", icon: Package },
 { label: "Stock Counts", href: "/stock-counts", icon: ClipboardList },
 ],
 },
 {
 label: "Production",
 items: [
 { label: "Orders", href: "/production/orders", icon: Factory },
 { label: "Work Centers", href: "/production/work-centers", icon: Wrench },
 { label: "MRP", href: "/mrp", icon: BarChart3 },
 ],
 },
 {
 label: "Projects",
 items: [
 { label: "Projects", href: "/projects", icon: FolderKanban },
 ],
 },
 {
 label: "Automation",
 items: [
 { label: "Workflows", href: "/workflows", icon: GitBranch },
 { label: "Integration", href: "/settings/integration", icon: Link2 },
 ],
 },
 {
 label: "Finance",
 items: [
 { label: "Account Groups", href: "/finance/groups", icon: Layers },
 { label: "Chart of Accounts", href: "/finance/accounts", icon: BookOpen },
 { label: "Journal Entries", href: "/finance/journal-entries", icon: FileText },
 { label: "Financial Reports", href: "/finance/reports", icon: BarChart3 },
 ],
 },
 {
 label: "Tax",
 items: [
 { label: "Tax Rates", href: "/tax-rates", icon: Percent },
 { label: "Tax Reports", href: "/tax-rates/reports", icon: FileText },
 ],
 },
 {
 label: "Analytics",
 items: [
 { label: "Reports", href: "/reports", icon: BarChart3 },
 { label: "Forecasting", href: "/forecast", icon: TrendingUp },
 { label: "Categories", href: "/categories", icon: Tags },
 ],
 },
 {
 label: "Settings",
 items: [
 {
 label: "Settings", icon: Settings,
 submenu: [
 { label: "General", href: "/settings" },
 { label: "Profile", href: "/settings/profile" },
 { label: "Workspaces", href: "/workspaces" },
 { label: "Billing", href: "/billing" },
 { label: "Notifications", href: "/notifications" },
 { label: "Send Notification", href: "/notifications/create" },
 ],
 },
 {
 label: "Access Control", icon: Shield,
 submenu: [
 { label: "Roles", href: "/settings/roles" },
 { label: "API Keys", href: "/settings/api-keys" },
 { label: "Audit Log", href: "/settings/audit" },
 { label: "Data Migration", href: "/migration" },
 ],
 },
 ],
 },
]

export function Sidebar({ collapsed, onCollapsedChange }: { collapsed?: boolean; onCollapsedChange?: (v: boolean) => void }) {
 const pathname = usePathname()
 const router = useRouter()
 const isCollapsed = collapsed ?? false
 const toggleCollapsed = () => onCollapsedChange?.(!isCollapsed)
 const { theme, toggleTheme } = useTheme()

 const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})


 useEffect(() => {
 menuGroups.forEach((group) => {
 group.items.forEach((item) => {
 if (item.submenu) {
 const isActive = item.submenu.some((sub) => pathname === sub.href || pathname.startsWith(sub.href + "/"))
 if (isActive) {
 setOpenMenus((prev) => ({ ...prev, [item.label]: true }))
 }
 }
 })
 })
 }, [pathname])

 const toggleMenu = (label: string) => {
 if (isCollapsed) {
 const group = menuGroups.flatMap((g) => g.items).find((i) => i.label === label)
 if (group?.submenu?.[0]?.href) {
 router.push(group.submenu[0].href)
 }
 return
 }
 setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }))
 }

 const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

 const renderNavItem = (item: MenuItem) => {
 const Icon = item.icon
 const hasSubmenu = item.submenu && item.submenu.length > 0
 const isExpanded = openMenus[item.label]
 const anyChildActive = hasSubmenu && item.submenu!.some((s) => isActive(s.href))

 if (hasSubmenu) {
 return (
 <div key={item.label}>
 <button
 onClick={() => toggleMenu(item.label)}
 className={cn(
 "nav-link group w-full flex items-center justify-between p-2 rounded-lg transition-all duration-150",
 anyChildActive ? "bg-primary/8 text-primary" : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-hover",
 isCollapsed && "justify-center"
 )}
 aria-expanded={isExpanded}
 >
 <div className="flex items-center gap-x-2 min-w-0">
 {Icon && <Icon className={cn("nav-icon w-[18px] h-[18px] shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5", anyChildActive && "text-primary")} />}
 {!isCollapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
 </div>
 {!isCollapsed && (
 <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform duration-200", isExpanded && "rotate-180")} />
 )}
 </button>
 {!isCollapsed && isExpanded && (
 <ul className="ml-2 pl-3 border-l border-sidebar-border space-y-0.5 mt-0.5">
 {item.submenu!.map((sub) => {
 const SubIcon = sub.icon
 const subActive = isActive(sub.href!)
 return (
 <li key={sub.label}>
 <Link
 href={sub.href!}
 className={cn(
 "nav-link group flex items-center gap-x-2 p-2 rounded-lg text-sm font-medium transition-all duration-150",
 subActive ? "bg-primary/8 text-primary" : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-hover"
 )}
 >
 {SubIcon && <SubIcon className="nav-icon w-4 h-4 shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />}
 <span className="truncate">{sub.label}</span>
 </Link>
 </li>
 )
 })}
 </ul>
 )}
 </div>
 )
 }

 return (
 <Link
 key={item.href}
 href={item.href!}
 className={cn(
 "nav-link group flex items-center gap-x-2 p-2 rounded-lg text-sm font-medium transition-all duration-150",
 isActive(item.href!) ? "bg-primary/8 text-primary" : "text-sidebar-foreground hover:text-foreground hover:bg-sidebar-hover",
 isCollapsed && "justify-center"
 )}
 title={isCollapsed ? item.label : undefined}
 >
 {Icon && <Icon className={cn("nav-icon w-[18px] h-[18px] shrink-0 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5", isActive(item.href!) && "text-primary")} />}
 {!isCollapsed && <span className="truncate">{item.label}</span>}
 </Link>
 )
 }

 return (
 <aside
 className={cn(
 "fixed left-0 top-0 z-40 h-full border-r border-sidebar-border bg-sidebar transition-all duration-200 flex flex-col",
 isCollapsed ? "w-16" : "w-60"
 )}
 >
 <div className={cn("flex items-center h-14 border-b border-sidebar-border px-3", isCollapsed && "justify-center px-0")}>
 <Link href="/dashboard" className="flex items-center gap-2.5">
 <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shrink-0 shadow-sm">
 <span className="text-white font-bold text-xs">I</span>
 </div>
 {!isCollapsed && <span className="font-semibold text-base tracking-tight">Ins</span>}
 </Link>
 </div>

 <div className="px-3 pt-3 pb-2 border-b border-sidebar-border">
 {!isCollapsed ? <WorkspaceSwitcher /> : <WorkspaceSwitcher collapsed />}
 </div>

 <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-5">
 {menuGroups.map((group) => (
 <div key={group.label}>
 {!isCollapsed && (
 <p className="nav-section-label px-1 mb-1">{group.label}</p>
 )}
 <div className="space-y-0.5">
 {group.items.map(renderNavItem)}
 </div>
 </div>
 ))}
 </nav>

 <div className="p-2 border-t border-sidebar-border space-y-1">
 <LanguageSwitcher collapsed={isCollapsed} />
 <button
 onClick={toggleTheme}
 className={cn(
 "nav-link group w-full flex items-center rounded-lg text-sidebar-muted hover:text-foreground hover:bg-sidebar-hover transition-all duration-150",
 isCollapsed ? "justify-center py-2" : "justify-between px-2 py-2"
 )}
 title={theme === "dark" ? "Light mode" : "Dark mode"}
 >
 <div className="flex items-center gap-2">
 {theme === "dark" ? <Sun className="nav-icon w-4 h-4 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" /> : <Moon className="nav-icon w-4 h-4 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />}
 {!isCollapsed && <span className="text-xs">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>}
 </div>
 </button>
 <button
 onClick={toggleCollapsed}
 className="nav-link group w-full flex items-center justify-center py-2 rounded-lg text-sidebar-muted hover:text-foreground hover:bg-sidebar-hover transition-all duration-150"
 title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
 >
 <ChevronLeft className={cn("nav-icon w-4 h-4 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5", isCollapsed && "rotate-180")} />
 </button>
 </div>
 </aside>
 )
}
