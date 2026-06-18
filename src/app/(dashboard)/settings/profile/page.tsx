"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Eye, EyeOff, Save, User } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [showCurrent, setShowCurrent] = useState(false)
 const [showNew, setShowNew] = useState(false)
 const [currentPassword, setCurrentPassword] = useState("")
 const [newPassword, setNewPassword] = useState("")
 const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)

 useEffect(() => {
 fetch("/api/users/me")
 .then((res) => res.json())
 .then((data) => { if (data?.email) setUser(data) })
 .catch(() => {})
 }, [])

 async function handleChangePassword(e: React.FormEvent) {
 e.preventDefault()
 if (!currentPassword || !newPassword) { toast.error("Both fields required"); return }
 if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/auth/password", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ currentPassword, newPassword })})
 if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed") }
 toast.success("Password changed successfully")
 setCurrentPassword("")
 setNewPassword("")
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to change password")
 } finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl pb-28">
 <div className="page-header"><div><h1>Profile</h1><p>Manage your account settings</p></div></div>

 <Card className="mb-6">
 <CardHeader><div className="flex items-center gap-2"><User className="w-4 h-4 text-primary" /><CardTitle>Account Info</CardTitle></div></CardHeader>
 <CardContent className="space-y-3">
 <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
 <span className="text-sm font-semibold text-primary">{user?.name?.charAt(0) || user?.email?.charAt(0) || "?"}</span>
 </div>
 <div>
 <p className="text-sm font-medium">{user?.name || "User"}</p>
 <p className="text-xs text-muted-foreground">{user?.email || "—"}</p>
 </div>
 </div>
 </CardContent>
 </Card>

 <Card>
 <CardHeader><div className="flex items-center gap-2"><CardTitle>Change Password</CardTitle></div></CardHeader>
 <CardContent>
 <form onSubmit={handleChangePassword} className="space-y-4">
 <div className="space-y-1">
<Label htmlFor="currentPassword">Current Password</Label>
 <div className="relative">
 <Input id="currentPassword" type={showCurrent ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
 <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
 {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 <div className="space-y-1">
<Label htmlFor="newPassword">New Password</Label>
 <div className="relative">
 <Input id="newPassword" type={showNew ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} placeholder="Min 6 characters" />
 <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
 {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 <Button type="submit" loading={loading} className="gap-2"><Save className="w-4 h-4" /> Change Password</Button>
 </form>
 </CardContent>
 </Card>
 </div>
 )
}
