"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { toast } from "sonner"
import { Building2, Save, Settings2 } from "lucide-react"
import { SkeletonPageHeader, SkeletonCard } from "@/components/ui/skeleton"

export default function SettingsPage() {
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState({ org: false, prefs: false })
 const [org, setOrg] = useState({ name: "", email: "", phone: "" })
 const [prefs, setPrefs] = useState({ currency: "THB", taxRate: "7", lowStockThreshold: "10", dateFormat: "DD/MM/YYYY", timezone: "Asia/Bangkok" })

 useEffect(() => {
 Promise.all([
 fetch("/api/settings").then(r => r.json()),
 ]).then(([s]) => {
 if (s && !s.error) {
 setPrefs({
 currency: s.currency || "THB",
 taxRate: String(s.taxRate || 7),
 lowStockThreshold: String(s.lowStockThreshold || 10),
 dateFormat: s.dateFormat || "DD/MM/YYYY",
 timezone: s.timezone || "Asia/Bangkok",
 })
 }
 }).finally(() => setLoading(false))
 }, [])

 async function handleSavePrefs() {
 setSaving({ ...saving, prefs: true })
 try {
 const res = await fetch("/api/settings", {
 method: "PUT",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 currency: prefs.currency,
 taxRate: parseFloat(prefs.taxRate) || 7,
 lowStockThreshold: parseInt(prefs.lowStockThreshold) || 10,
 dateFormat: prefs.dateFormat,
 timezone: prefs.timezone,
 }),
 })
 if (!res.ok) throw new Error()
 toast.success("Preferences saved")
 } catch { toast.error("Failed to save") }
 finally { setSaving({ ...saving, prefs: false }) }
 }

 if (loading) return <div className="animate-fade-in space-y-6"><SkeletonPageHeader /><div className="grid grid-cols-2 gap-6"><SkeletonCard /><SkeletonCard /></div></div>

 return (
 <div className="animate-fade-in">
 <div className="page-header"><h1>Settings</h1><p>Manage your organization settings and preferences</p></div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <Card>
 <CardHeader>
 <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /><CardTitle>Organization</CardTitle></div>
 <CardDescription>Update your company information</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="company">Company Name</Label>
 <Input id="company" value={org.name} onChange={(e) => setOrg({ ...org, name: e.target.value })} placeholder="My Company" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="email">Email</Label>
 <Input id="email" type="email" value={org.email} onChange={(e) => setOrg({ ...org, email: e.target.value })} placeholder="hello@company.com" />
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone">Phone</Label>
 <Input id="phone" value={org.phone} onChange={(e) => setOrg({ ...org, phone: e.target.value })} placeholder="+66 2 123 4567" />
 </div>
 <Button className="gap-1.5"><Save className="w-4 h-4" /> Save Changes</Button>
 </CardContent>
 </Card>

 <Card>
 <CardHeader>
 <div className="flex items-center gap-2"><Settings2 className="w-4 h-4 text-primary" /><CardTitle>Preferences</CardTitle></div>
 <CardDescription>Configure system defaults</CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="currency">Currency</Label>
 <Select
 id="currency"
 options={[
 { value: "THB", label: "THB (฿)" },
 { value: "USD", label: "USD ($)" },
 { value: "EUR", label: "EUR (€)" },
 ]}
 value={prefs.currency}
 onChange={(e: any) => setPrefs({ ...prefs, currency: e.target.value })}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="tax">Tax Rate (%)</Label>
 <Input id="tax" type="number" value={prefs.taxRate} onChange={(e) => setPrefs({ ...prefs, taxRate: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="lowStock">Low Stock Threshold</Label>
 <Input id="lowStock" type="number" value={prefs.lowStockThreshold} onChange={(e) => setPrefs({ ...prefs, lowStockThreshold: e.target.value })} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="timezone">Timezone</Label>
 <Select
 id="timezone"
 options={[
 { value: "Asia/Bangkok", label: "Asia/Bangkok (ICT)" },
 { value: "Asia/Singapore", label: "Asia/Singapore (SGT)" },
 { value: "America/New_York", label: "America/New_York (EST)" },
 { value: "Europe/London", label: "Europe/London (GMT)" },
 ]}
 value={prefs.timezone}
 onChange={(e: any) => setPrefs({ ...prefs, timezone: e.target.value })}
 />
 </div>
 <Button onClick={handleSavePrefs} loading={saving.prefs} className="gap-1.5"><Save className="w-4 h-4" /> Save Preferences</Button>
 </CardContent>
 </Card>
 </div>
 </div>
 )
}
