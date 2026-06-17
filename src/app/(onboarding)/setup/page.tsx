"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { SelectNative } from "@/components/ui/select-native"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Building2, Settings2, Users, CheckCircle2, Check, Plus, X, ArrowRight, ArrowLeft } from "lucide-react"
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
          invites: step === 3 ? invites : [] })})
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <Skeleton className="w-12 h-12 rounded-full mx-auto" />
          <p className="text-sm text-muted-foreground">Loading setup...</p>
        </div>
      </div>
    )
  }

  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Dialog open>
        <DialogContent className="sm:max-w-[480px] gap-0 p-0">
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-[11px]">I</span>
              </div>
              <span className="font-semibold text-sm">Ins</span>
            </div>
            <DialogTitle>Welcome to Ins</DialogTitle>
            <DialogDescription>Let&apos;s get your workspace set up in a few steps</DialogDescription>
          </DialogHeader>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4 px-1">
              {STEPS.map((s, i) => (
                <div key={s.key} className="flex flex-col items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                    i <= step ? "bg-primary text-primary-foreground" : "bg-accent text-muted-foreground"
                  }`}>
                    {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground">{s.label}</span>
                </div>
              ))}
            </div>
            <Progress value={progress} className="mb-6" />

            {step === 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Company Information</h3>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="e.g. ACME Corp" />
                  <p className="text-xs text-muted-foreground">This will appear on invoices, reports, and emails</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Default Preferences</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
                    <SelectNative id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="THB">THB (฿)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="SGD">SGD (S$)</option>
                      <option value="JPY">JPY (¥)</option>
                    </SelectNative>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxRate">Tax Rate (%)</Label>
                    <Input id="taxRate" type="number" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <SelectNative id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      <option value="Asia/Bangkok">Bangkok (ICT)</option>
                      <option value="Asia/Singapore">Singapore (SGT)</option>
                      <option value="Asia/Ho_Chi_Minh">Vietnam (ICT)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="Europe/London">London (GMT)</option>
                    </SelectNative>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lowStock">Low Stock Alert</Label>
                    <Input id="lowStock" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold">Invite Your Team</h3>
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
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {invites.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {invites.map((email) => (
                      <Badge key={email} variant="secondary" className="gap-1 text-xs pe-1">
                        {email}
                        <button onClick={() => setInvites(invites.filter((e) => e !== email))} className="ml-0.5 hover:text-foreground">
                          <X className="w-3 h-3" />
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

            {step === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">You&apos;re all set!</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    Your workspace is ready. Start adding products, customers, and managing your business.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-3 pt-1">
                  <Button variant="outline" onClick={() => router.push("/knowledge/wiki")}>
                    View Tutorials
                  </Button>
                  <Button onClick={() => router.push("/dashboard")} className="gap-1.5">
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            )}

            {step < 3 && (
              <div className="flex items-center justify-between pt-5 mt-5 border-t border-border">
                <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)} className="gap-1.5">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <div className="flex items-center gap-2">
                  {step === 2 && (
                    <Button variant="outline" onClick={handleFinish} loading={saving}>
                      Skip
                    </Button>
                  )}
                  <Button onClick={step < 2 ? () => setStep(step + 1) : handleFinish} loading={saving} className="gap-1.5">
                    {step === 2 ? "Finish Setup" : "Continue"} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
