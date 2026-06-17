"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Building2, Plus, Layers, Settings, ArrowRight } from "lucide-react"

type Workspace = {
 id: string
 name: string
 slug: string
 role: string
 createdAt: string
}

export default function WorkspacesPage() {
 const [workspaces, setWorkspaces] = useState<Workspace[]>([])
 const [loading, setLoading] = useState(true)
 const handleNew = useCallback(() => { window.location.href = "/workspaces/new" }, [])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/workspaces")
 .then((r) => r.json())
 .then((d) => { if (Array.isArray(d)) setWorkspaces(d) })
 .catch(() => {})
 .finally(() => setLoading(false))
 }, [])

 if (loading) return <div className="animate-fade-in p-8 text-center text-muted-foreground">Loading...</div>

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Workspaces</h1><p>Manage your brands and organizations</p></div>
 <Link href="/workspaces/new">
 <Button className="gap-1.5"><Plus className="w-4 h-4" /> New Workspace <ShortcutBadge shortcut="⌘C" /></Button>
 </Link>
 </div>

 {workspaces.length === 0 ? (
 <EmptyState
 icons={[<Building2 key="1" className="w-6 h-6" />, <Layers key="2" className="w-6 h-6" />, <Settings key="3" className="w-6 h-6" />]}
 title="No workspaces yet"
 description="Create your first workspace to get started."
 actions={[{ label: "Create Workspace", onClick: () => window.location.href = "/workspaces/new" }]}
 />
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {workspaces.map((w) => (
 <Card key={w.id} className="hover:shadow-md transition-shadow">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-base">
 <Building2 className="w-4 h-4 text-primary" />
 {w.name}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-xs text-muted-foreground mb-1">Role: <span className="capitalize font-medium text-foreground">{w.role}</span></p>
 <p className="text-xs text-muted-foreground">Slug: <span className="font-mono">{w.slug}</span></p>
 <Link href={`/workspaces/${w.id}`} className="flex items-center gap-1 text-xs text-primary hover:underline mt-3">
 Manage </Link>
 </CardContent>
 </Card>
 ))}
 </div>
 )}
 </div>
 )
}
