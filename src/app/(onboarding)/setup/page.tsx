"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
 Building2, Settings2, Users, CheckCircle2, ArrowRight, ArrowLeft,
 Sparkles, Mail, Plus, X} from "lucide-react"
import { toast } from "sonner"

const STEPS = [
 { key: "company", label: "Company", icon: Building2 },
 { key: "preferences", label: "Preferences", icon: Settings2 },
 { key: "team", label: "Team", icon: Users },
 { key: "done", label: "Done", icon: CheckCircle2 },
]

export default function SetupPage() {
 const router = useRouter()
 const { data: session, update } = useSession()
 const [step, setStep] = useState(0)
 const [loading, setLoading] = useState(true)
 const [saving, setSaving] = useState(false)
 const [orgName, setOrgName] = useState("")
 const [currency, setCurrency] = useState("THB")
 const [taxRate, setTaxRate] = useState("7")
 const [timezone, setTimezone] = useState("Asia/Bangkok")
 const [lowStockThreshold, setLowStockThreshold] = useState("10")
 const [invites, setInvites] = useState<string[]>([])
 const [inviteEmail, setInviteEmail] = useState("")

 useEffect(() => {
 fetch("/api/onboarding")
 .then((r) => r.json())
 .then((data) => {
 if (!data.error) {
 if (data.onboardingCompleted) {
 router.push("/dashboard")
 return
 }
 if (data.org) setOrgName(data.org.name || "")
 if (data.settings) {
 setCurrency(data.settings.currency || "THB")
 setTaxRate(String(data.settings.taxRate || 7))
 setTimezone(data.settings.timezone || "Asia/Bangkok")
 setLowStockThreshold(String(data.settings.lowStockThreshold || 10))
 }
 }
 setLoading(false)
 })
 .catch(() => {
 setLoading(false)
 router.push("/dashboard")
 })
 }, [router])

 function addInvite() {
 if (inviteEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail) && !invites.includes(inviteEmail)) {
 setInvites([...invites, inviteEmail])
 setInviteEmail("")
 }
 }

 async function handleFinish() {
 setSaving(true)
 try {
 const res = await fetch("/api/onboarding", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 orgName,
 currency,
 taxRate,
 timezone,
 lowStockThreshold,
 invites: step === 3 ? invites : []})})
 if (!res.ok) throw new Error()
 await update()
 setStep(3)
 toast.success("Setup complete! Welcome to Ins.")
 } catch {
 toast.error("Failed to save settings")
 } finally {
 setSaving(false)
 }
 }

 if (loading) {
 return (
 <Card>
 <CardContent className="p-12 text-center">
 <Skeleton className="w-12 h-12 rounded-full mx-auto mb-4" />
 <p className="text-muted-foreground">Loading setup...</p>
 </CardContent>
 </Card>
 )
 }

 const progress = ((step + 1) / STEPS.length) * 100

 return (
 <div className="animate-fade-in">
 <div className="flex items-center justify-center gap-2 mb-6">
 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
 <span className="text-white font-bold text-sm">I</span>
 </div>
 <span className="font-semibold text-lg">Ins</span>
 </div>

 <Card>
 <CardHeader className="text-center pb-2">
 <CardTitle className="text-2xl flex items-center justify-center gap-2">
 Welcome to Ins
 </CardTitle>
 <CardDescription>Let&apos;s get your workspace set up in a few steps</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="flex items-center justify-between mb-6 px-1">
 {STEPS.map((s, i) => (
 <div key={s.key} className="flex flex-col items-center gap-1.5">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
 i <= step ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground"
 }`}>
 {i < step ? "✓" : i + 1}
 </div>
 <span className="text-[10px] font-medium text-muted-foreground">{s.label}</span>
 </div>
 ))}
 </div>
 <Progress value={progress} className="mb-6" />

 {/* Step 0: Company */}
 {step === 0 && (
 <div className="space-y-4">
 <div className="flex items-center gap-2 mb-4">
 <Building2 className="w-5 h-5 text-primary" />
 <h3 className="font-semibold">Company Information</h3>
 </div>
 <div className="space-y-2">
 <Label htmlFor="orgName">Organization Name</Label>
 <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. ACME Corp" />
 <p className="text-xs text-muted-foreground">This will appear on invoices, reports, and emails</p>
 </div>
 </div>
 )}

 {/* Step 1: Preferences */}
 {step === 1 && (
 <div className="space-y-4">
 <div className="flex items-center gap-2 mb-4">
 <Settings2 className="w-5 h-5 text-primary" />
 <h3 className="font-semibold">Default Preferences</h3>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <Label htmlFor="currency">Currency</Label>
 <Select
 id="currency"
 options={[
 { value: "THB", label: "THB (฿)" },
 { value: "USD", label: "USD ($)" },
 { value: "EUR", label: "EUR (€)" },
 { value: "SGD", label: "SGD (S$)" },
 { value: "JPY", label: "JPY (¥)" },
 ]}
 value={currency}
 onChange={(e: any) => setCurrency(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="taxRate">Tax Rate (%)</Label>
 <Input id="taxRate" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="timezone">Timezone</Label>
 <Select
 id="timezone"
 options={[
 { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
 { value: "Asia/Singapore", label: "Singapore (SGT)" },
 { value: "Asia/Ho_Chi_Minh", label: "Vietnam (ICT)" },
 { value: "America/New_York", label: "New York (EST)" },
 { value: "Europe/London", label: "London (GMT)" },
 ]}
 value={timezone}
 onChange={(e: any) => setTimezone(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="lowStock">Low Stock Alert</Label>
 <Input id="lowStock" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
 </div>
 </div>
 </div>
 )}

 {/* Step 2: Invite Team */}
 {step === 2 && (
 <div className="space-y-4">
 <div className="flex items-center gap-2 mb-4">
 <h3 className="font-semibold">Invite Your Team</h3>
 </div>
 <p className="text-sm text-muted-foreground">Invite colleagues to join your workspace (optional)</p>
 <div className="flex items-center gap-2">
 <Input
 type="email"
 placeholder="colleague@company.com"
 value={inviteEmail}
 onChange={(e) => setInviteEmail(e.target.value)}
 onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addInvite())}
 />
 <Button variant="outline" size="icon" onClick={addInvite} type="button">
 </Button>
 </div>
 {invites.length > 0 && (
 <div className="flex flex-wrap gap-2">
 {invites.map((email) => (
 <Badge key={email} variant="secondary" className="gap-1 text-xs">
 {email}
 <button onClick={() => setInvites(invites.filter((e) => e !== email))}>
 </button>
 </Badge>
 ))}
 </div>
 )}
 <p className="text-xs text-muted-foreground">
 {process.env.NEXT_PUBLIC_SMTP_HOST ? "Invitations will be sent via email" : "Email sending not configured — invite team members from Settings later"}
 </p>
 </div>
 )}

 {/* Step 3: Done */}
 {step === 3 && (
 <div className="text-center py-6 space-y-4">
 <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
 </div>
 <h3 className="text-xl font-semibold">You&apos;re all set!</h3>
 <p className="text-sm text-muted-foreground max-w-sm mx-auto">
 Your workspace is ready. Start adding products, customers, and managing your business.
 </p>
 <div className="flex items-center justify-center gap-3 pt-2">
 <Button variant="outline" onClick={() => router.push("/knowledge/wiki")}>
 View Tutorials
 </Button>
 <Button onClick={() => router.push("/dashboard")} className="gap-1.5">
 Go to Dashboard </Button>
 </div>
 </div>
 )}

 {step < 3 && (
 <div className="flex items-center justify-between pt-6 mt-6 border-t border-border">
 <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
 Back
 </Button>
 <div className="flex items-center gap-2">
 {step === 2 && (
 <Button variant="outline" onClick={handleFinish} loading={saving}>
 Skip </Button>
 )}
 <Button onClick={step < 2 ? () => setStep(step + 1) : handleFinish} loading={saving}>
 {step === 2 ? "Finish Setup" : "Continue"} </Button>
 </div>
 </div>
 )}
 </CardContent>
 </Card>

 <p className="text-center text-xs text-muted-foreground mt-4">
 <button onClick={() => signOut({ callbackUrl: "/login" })} className="hover:underline">Sign out</button>
 </p>
 </div>
 )
}
