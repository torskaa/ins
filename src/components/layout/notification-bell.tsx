"use client"

import { useState, useRef, useEffect } from "react"
import { Bell, CheckCheck, MessageSquare, UserPlus, Mail, FileText, AtSign, Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type RichNotification = {
 id: string
 type: string
 user: { name: string; avatar: string; fallback: string }
 action: string
 target?: string
 content?: string
 timeAgo: string
 timestamp: Date
 isRead: boolean
 hasActions?: boolean
 file?: { name: string; size: string; type: string }
}

const typeMeta: Record<string, { icon: React.ElementType; color: string; dot: string }> = {
 comment: { icon: MessageSquare, color: "text-primary", dot: "bg-primary" },
 follow: { icon: UserPlus, color: "text-primary", dot: "bg-primary" },
 invitation: { icon: Mail, color: "text-primary", dot: "bg-primary" },
 file_share: { icon: FileText, color: "text-primary", dot: "bg-primary" },
 mention: { icon: AtSign, color: "text-primary", dot: "bg-primary" },
 like: { icon: Heart, color: "text-primary", dot: "bg-primary" },
}

function formatTimeAgo(date: Date) {
 const diff = Date.now() - date.getTime()
 const mins = Math.floor(diff / 60000)
 if (mins < 1) return "just now"
 if (mins < 60) return `${mins}m ago`
 const hrs = Math.floor(mins / 60)
 if (hrs < 24) return `${hrs}h ago`
 const days = Math.floor(hrs / 24)
 if (days < 7) return `${days}d ago`
 return date.toLocaleDateString()
}

const MOCK_NOTIFICATIONS: RichNotification[] = [
 { id: "mock-1", type: "comment", user: { name: "Amélie", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Amélie", fallback: "A" }, action: "commented on", target: "PO-2024-001", content: "The supplier confirmed the delivery date has been moved up.", timeAgo: "2 hours ago", timestamp: new Date(Date.now() - 2 * 3600000), isRead: false },
 { id: "mock-2", type: "follow", user: { name: "Sienna", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sienna", fallback: "S" }, action: "assigned you to", target: "Inventory Audit Q2", timeAgo: "2 hours ago", timestamp: new Date(Date.now() - 3 * 3600000), isRead: false },
 { id: "mock-3", type: "invitation", user: { name: "Ammar", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Ammar", fallback: "A" }, action: "invited you to", target: "Warehouse Team", timeAgo: "3 hours ago", timestamp: new Date(Date.now() - 4 * 3600000), isRead: false, hasActions: true },
 { id: "mock-4", type: "file_share", user: { name: "Mathilde", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Mathilde", fallback: "M" }, action: "shared a file in", target: "Q2 Reports", file: { name: "inventory-report-q2.xlsx", size: "2.4 MB", type: "XLSX" }, timeAgo: "4 hours ago", timestamp: new Date(Date.now() - 5 * 3600000), isRead: true },
 { id: "mock-5", type: "mention", user: { name: "James", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=James", fallback: "J" }, action: "mentioned you in", target: "Stock Review", content: "Hey @you, can you review the low stock items when you get a chance?", timeAgo: "1 day ago", timestamp: new Date(Date.now() - 24 * 3600000), isRead: true },
 { id: "mock-6", type: "like", user: { name: "Sofia", avatar: "https://api.dicebear.com/7.x/notionists/svg?seed=Sofia", fallback: "S" }, action: "liked your report in", target: "Monthly Analysis", timeAgo: "1 day ago", timestamp: new Date(Date.now() - 26 * 3600000), isRead: true },
]

export function NotificationBell() {
 const [open, setOpen] = useState(false)
 const [notifications, setNotifications] = useState<RichNotification[]>(MOCK_NOTIFICATIONS)
 const [unreadCount, setUnreadCount] = useState(MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length)
 const [activeTab, setActiveTab] = useState("all")
 const ref = useRef<HTMLDivElement>(null)
 const router = useRouter()

 useEffect(() => {
 function handleKey(e: KeyboardEvent) {
 if (e.key === "Escape") setOpen(false)
 }
 if (open) document.addEventListener("keydown", handleKey)
 return () => document.removeEventListener("keydown", handleKey)
 }, [open])

 useEffect(() => {
 function handleClickOutside(e: MouseEvent) {
 if (ref.current && !ref.current.contains(e.target as Node)) {
 setOpen(false)
 }
 }
 if (open) document.addEventListener("mousedown", handleClickOutside)
 return () => document.removeEventListener("mousedown", handleClickOutside)
 }, [open])

 function markAllRead() {
 if (notifications.every(n => n.isRead)) return
 setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
 setUnreadCount(0)
 }

 const mentionCount = notifications.filter((n) => n.type === "mention").length
 const unreadNotifs = notifications.filter((n) => !n.isRead)

 const filtered = activeTab === "mentions"
 ? notifications.filter((n) => n.type === "mention")
 : activeTab === "unread"
 ? unreadNotifs
 : notifications

 return (
 <>
 <button
 onClick={() => setOpen(true)}
  className="group relative p-2 rounded-md hover:bg-surface hover:text-primary transition-all"
 >
 <Bell className="w-4.5 h-4.5 text-muted-foreground transition-all duration-150 group-hover:scale-110 group-hover:text-primary" />
 {unreadCount > 0 && (
 <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
 {unreadCount > 9 ? "9+" : unreadCount}
 </span>
 )}
 </button>

 {open && (
 <div
 ref={ref}
 className="fixed right-4 top-[4.5rem] z-50 w-[28rem] bg-background border border-border rounded-2xl shadow-dropdown animate-scale-in origin-top-right"
 >
 <div className="flex items-center justify-between px-5 py-4 border-b border-border">
 <div>
 <h3 className="text-base font-semibold text-foreground tracking-[-0.006em]">Notifications</h3>
 <p className="text-xs text-muted-foreground mt-0.5">Stay up to date with your team</p>
 </div>
 <div className="flex items-center gap-1">
 {unreadCount > 0 && (
 <button
 onClick={markAllRead}
 className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-colors"
 >
 <CheckCheck className="w-3.5 h-3.5" />
 Mark all read
 </button>
 )}
 <button
 onClick={() => { setOpen(false); router.push("/settings") }}
 className="flex items-center justify-center size-7 text-muted-foreground hover:text-foreground hover:bg-surface rounded-lg transition-colors"
 >
 </button>
 </div>
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="px-5 pt-3">
 <TabsList className="**:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:bg-surface **:data-[slot=badge]:text-muted-foreground [&_button]:gap-1.5 w-full bg-surface">
 <TabsTrigger value="all" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">All <Badge variant="secondary">{notifications.length}</Badge></TabsTrigger>
 <TabsTrigger value="unread" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">Unread <Badge variant="secondary">{unreadCount}</Badge></TabsTrigger>
 <TabsTrigger value="mentions" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm">Mentions <Badge variant="secondary">{mentionCount}</Badge></TabsTrigger>
 </TabsList>
 </Tabs>

 <div className="max-h-96 overflow-y-auto">
 {filtered.length === 0 ? (
 <div className="flex flex-col items-center py-12 text-center">
 <div className="size-14 rounded-2xl bg-surface flex items-center justify-center mb-3">
 <Bell className="w-7 h-7 text-muted-foreground/40" />
 </div>
 <p className="text-sm font-medium text-foreground/60">
 {activeTab === "all" ? "No notifications yet." : activeTab === "unread" ? "All caught up!" : "No mentions."}
 </p>
 <p className="text-xs text-muted-foreground mt-0.5">You&rsquo;ll see updates here when they arrive.</p>
 </div>
 ) : (
 <div className="divide-y divide-border">
 {filtered.map((n) => {
 const meta = typeMeta[n.type] || typeMeta.comment
 const Icon = meta.icon
 return (
 <div
 key={n.id}
 className={cn(
 "w-full px-5 py-3.5 text-left transition-colors hover:bg-surface/50 last:border-b-0",
 !n.isRead && "bg-primary/[0.02]"
 )}
 >
 <div className="flex gap-3">
 <Avatar className="size-9 shrink-0 mt-0.5 ring-2 ring-background shadow-sm">
 <AvatarImage src={n.user.avatar} alt={n.user.name} className="object-cover" />
 <AvatarFallback className="bg-surface text-muted-foreground text-xs">{n.user.fallback}</AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0 space-y-1.5">
 <div className="flex items-start justify-between gap-2">
 <p className={cn("text-sm leading-snug text-foreground", !n.isRead && "font-semibold")}>
 <span className="font-semibold">{n.user.name}</span>
 <span className="text-muted-foreground font-normal"> {n.action} </span>
 {n.target && <span className="font-semibold text-foreground/80">{n.target}</span>}
 </p>
 {!n.isRead && <div className={cn("size-2 shrink-0 rounded-full mt-1.5", meta.dot)} />}
 </div>
 <div className="flex items-center gap-1.5">
 <Icon className={cn("size-3", meta.color)} />
 <p className="text-[11px] text-muted-foreground font-medium">{formatTimeAgo(n.timestamp)}</p>
 </div>
 {n.content && (
 <p className="text-xs text-foreground/70 leading-relaxed rounded-xl bg-surface border border-border/60 p-3 line-clamp-2 shadow-sm">
 {n.content}
 </p>
 )}
 {n.file && (
 <div className="flex items-center gap-3 rounded-xl bg-surface border border-border p-3 shadow-sm">
 <div className="size-10 shrink-0 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[11px] font-bold text-white shadow-sm">
 {n.file.type}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs font-semibold text-foreground truncate">{n.file.name}</p>
 <p className="text-[10px] text-muted-foreground">{n.file.type} &bull; {n.file.size}</p>
 </div>
 <Button variant="ghost" size="icon" className="size-8 shrink-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface">
 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
 </Button>
 </div>
 )}
 {n.hasActions && (
 <div className="flex gap-2 pt-0.5">
 <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl">Decline</Button>
 <Button size="sm" className="h-8 text-xs rounded-xl bg-primary text-primary-foreground shadow-sm hover:bg-primary-dark">Accept</Button>
 </div>
 )}
 </div>
 </div>
 </div>
 )
 })}
 </div>
 )}
 </div>

 <div className="border-t border-border px-5 py-3">
 <Button
 variant="ghost"
 size="sm"
 className="w-full text-xs text-muted-foreground hover:text-foreground hover:bg-surface rounded-xl"
 onClick={() => { setOpen(false); router.push("/settings") }}
 >
 View all notifications
 </Button>
 </div>
 </div>
 )}
 </>
 )
}
