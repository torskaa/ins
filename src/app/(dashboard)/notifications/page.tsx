"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Package, ShoppingCart, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { Badge } from "@/components/ui/badge"
import { timeAgo } from "@/lib/utils"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const typeConfig: Record<string, { icon: any; color: string; bg: string }> = {
 warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/15" },
 success: { icon: CheckCircle, color: "text-success", bg: "bg-success/15" },
 info: { icon: Info, color: "text-primary", bg: "bg-primary/10" },
 low_stock: { icon: Package, color: "text-amber-600", bg: "bg-amber-100" },
 order: { icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
}

type Notification = {
 id: string
 type: string
 title: string
 message: string | null
 link: string | null
 read: boolean
 createdAt: string
}

export default function NotificationsPage() {
 const [notifications, setNotifications] = useState<Notification[]>([])
 const [loading, setLoading] = useState(true)
 const [marking, setMarking] = useState(false)

 useEffect(() => {
 fetch("/api/notifications")
 .then(r => r.json())
 .then((data) => { if (Array.isArray(data)) setNotifications(data) })
 .finally(() => setLoading(false))
 }, [])

 async function handleMarkAllRead() {
 setMarking(true)
 try {
 const res = await fetch("/api/notifications", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ action: "markAllRead" }),
 })
 if (!res.ok) throw new Error()
 setNotifications(notifications.map(n => ({ ...n, read: true })))
 toast.success("All notifications marked as read")
 } catch { toast.error("Failed to mark as read") }
 finally { setMarking(false) }
 }

 const unreadCount = notifications.filter(n => !n.read).length
 const config = typeConfig

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Notifications</h1>
 <p>Stay updated with your latest activities</p>
 </div>
 <div className="flex items-center gap-2">
 {unreadCount > 0 && (
 <Badge variant="default" className="bg-primary text-white">{unreadCount} unread</Badge>
 )}
 <MoreMenu actions={[
 { label: "Mark All Read", icon: ActionIcons.Refresh, onClick: handleMarkAllRead },
 ]} />
 </div>
 </div>

 <Card>
 <CardContent className="p-0">
 {loading ? (
 <div className="space-y-0 divide-y divide-border">
 {[1, 2, 3].map(i => (
 <div key={i} className="flex items-start gap-4 p-5">
 <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
 <div className="flex-1 space-y-2">
 <Skeleton className="h-4 w-48" />
 <Skeleton className="h-3 w-96" />
 <Skeleton className="h-3 w-20" />
 </div>
 </div>
 ))}
 </div>
 ) : notifications.length === 0 ? (
 <div className="flex flex-col items-center py-16 text-muted-foreground">
 <Bell className="w-10 h-10 mb-3" />
 <p className="text-sm font-medium">No notifications yet</p>
 <p className="text-xs mt-1">Notifications will appear here when something happens.</p>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {notifications.map((notif) => {
 const cfg = config[notif.type] || config.info
 const Icon = cfg.icon
 return (
 <div key={notif.id} className={`flex items-start gap-4 p-5 hover:bg-surface transition-colors ${!notif.read ? "bg-primary/[0.02]" : ""}`}>
 <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.bg}`}>
 <Icon className={`w-4 h-4 ${cfg.color}`} />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <p className={`text-sm ${!notif.read ? "font-semibold" : "font-medium"}`}>{notif.title}</p>
 {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
 <Badge variant={notif.type === "warning" || notif.type === "low_stock" ? "destructive" : notif.type === "success" ? "success" : "default"} className="capitalize">{notif.type.replace(/_/g, " ")}</Badge>
 </div>
 <p className="text-sm text-muted-foreground">{notif.message}</p>
 <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(new Date(notif.createdAt))}</p>
 </div>
 </div>
 )
 })}
 </div>
 )}
 </CardContent>
 </Card>
 </div>
 )
}
