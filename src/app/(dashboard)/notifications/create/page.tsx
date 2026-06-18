"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Bell, XCircle } from "lucide-react"
import { toast } from "sonner"

export default function CreateNotificationPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [form, setForm] = useState({ title: "", message: "", type: "info" })

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!form.title) { toast.error("Title is required"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/notifications/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
 if (!res.ok) throw new Error()
 toast.success("Notification sent"); router.push("/notifications"); router.refresh()
 } catch { toast.error("Failed to send") } finally { setLoading(false) }
 }

 return (
 <div className="animate-fade-in max-w-2xl">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>
 <div className="page-header"><h1>Send Notification</h1><p>Create and send a notification</p></div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card><CardHeader className="pb-3"><h3 className="text-sm font-semibold flex items-center gap-2"><Bell className="w-4 h-4" /> Notification Details</h3></CardHeader>
 <CardContent className="space-y-4 pt-0">
 <div className="space-y-1"><Label>Title <span className="text-destructive">*</span></Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Notification title" /></div>
 <div className="space-y-1"><Label>Message</Label><Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Notification message..." /></div>
 <div className="space-y-1"><Label>Type</Label><Select options={[{ value: "info", label: "Info" }, { value: "success", label: "Success" }, { value: "warning", label: "Warning" }, { value: "error", label: "Error" }, { value: "low_stock", label: "Low Stock" }, { value: "order", label: "Order" }]} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} /></div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
 <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
 <Button type="submit" loading={loading}>Send Notification</Button>
 </div>
 </form>
 </div>
 )
}
