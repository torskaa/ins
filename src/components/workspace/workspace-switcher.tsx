"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Building2, ChevronDown } from "lucide-react"

type Workspace = {
 id: string
 name: string
 slug: string
 role: string
}

export default function WorkspaceSwitcher({ collapsed }: { collapsed?: boolean }) {
 const { data: session, update } = useSession()
 const router = useRouter()
 const [workspaces, setWorkspaces] = useState<Workspace[]>([])
 const [open, setOpen] = useState(false)
 const [loading, setLoading] = useState(false)
 const ref = useRef<HTMLDivElement>(null)

 useEffect(() => {
 fetch("/api/workspaces")
 .then((r) => { if (!r.ok) throw new Error(); return r.json() })
 .then((data) => { if (Array.isArray(data)) setWorkspaces(data) })
 .catch(() => {})
 }, [])

 useEffect(() => {
 function handleClickOutside(e: MouseEvent) {
 if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
 }
 document.addEventListener("mousedown", handleClickOutside)
 return () => document.removeEventListener("mousedown", handleClickOutside)
 }, [])

 const activeOrgId = (session?.user as any)?.activeOrganizationId
 const active = workspaces.find((w) => w.id === activeOrgId) || workspaces[0]

 async function switchWorkspace(orgId: string) {
 setOpen(false)
 if (orgId === activeOrgId) return
 setLoading(true)
 try {
 await update({ activeOrganizationId: orgId })
 router.refresh()
 } catch {
 } finally {
 setLoading(false)
 }
 }

 const dropdown = (
 <AnimatePresence>
 {open && (
 <motion.div
 initial={{ opacity: 0, scale: 0.95, y: -4 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.95, y: -4 }}
 transition={{ duration: 0.15 }}
 className={cn(
 "rounded-xl bg-popover shadow-dropdown border border-border py-1.5 text-sm z-50 overflow-hidden",
 collapsed ? "absolute left-12 top-0 w-56" : "absolute top-full left-0 right-0 mt-1"
 )}
 >
 <div className="px-3 py-2 border-b border-border">
 <p className="text-xs font-medium text-muted-foreground">Switch workspace</p>
 </div>
 {workspaces.map((w, i) => (
 <motion.button
 key={w.id}
 initial={{ opacity: 0, x: -8 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ delay: i * 0.03 }}
 onClick={() => switchWorkspace(w.id)}
 disabled={loading}
 className={cn(
 "flex items-center gap-2.5 w-full px-3 py-2.5 text-left hover:bg-surface transition-colors",
 w.id === active?.id && "text-primary font-medium"
 )}
 >
 <div className={cn(
 "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
 w.id === active?.id
 ? "bg-primary/10 text-primary"
 : "bg-muted text-muted-foreground"
 )}>
 <Building2 className="w-3.5 h-3.5" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="truncate text-sm">{w.name}</p>
 <p className="truncate text-xs text-muted-foreground capitalize">{w.role}</p>
 </div>
 {w.id === active?.id && null}
 </motion.button>
 ))}
 <div className="border-t border-border mt-1 pt-1 pb-1">
 <button
 onClick={() => { setOpen(false); router.push("/workspaces/new") }}
 className="flex items-center gap-2.5 w-full px-3 py-2.5 text-left text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
 >
 <div className="w-7 h-7 rounded-lg border border-dashed border-border flex items-center justify-center shrink-0">
 </div>
 <span className="text-sm">New Workspace</span>
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 )

 if (collapsed) {
 return (
 <div ref={ref} className="relative">
 <button
 onClick={() => setOpen(!open)}
 className="w-8 h-8 rounded-lg bg-sidebar-hover flex items-center justify-center mx-auto text-sidebar-muted hover:text-foreground transition-colors"
 title={active?.name || "Workspaces"}
 >
 <Building2 className="w-4 h-4" />
 </button>
 {dropdown}
 </div>
 )
 }

 return (
 <div ref={ref} className="relative">
 <button
 onClick={() => setOpen(!open)}
 className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm text-sidebar-muted hover:text-foreground hover:bg-sidebar-hover transition-all duration-150 group"
 >
 <div className="w-6 h-6 rounded-md bg-sidebar-hover flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
 <Building2 className="w-3.5 h-3.5" />
 </div>
 <span className="flex-1 text-left truncate font-medium">{active?.name || "Select workspace"}</span>
 <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", open && "rotate-180")} />
 </button>
 {dropdown}
 </div>
 )
}
