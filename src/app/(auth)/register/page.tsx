"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { UserPlus, Eye, EyeOff } from "lucide-react"
import Link from "next/link"

export default function RegisterPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [showPassword, setShowPassword] = useState(false)
 const [name, setName] = useState("")
 const [email, setEmail] = useState("")
 const [password, setPassword] = useState("")
 const [orgName, setOrgName] = useState("")

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!name.trim() || !email.trim() || !password || !orgName.trim()) {
 toast.error("All fields are required"); return
 }
 if (password.length < 6) { toast.error("Password must be at least 6 characters"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/auth/register", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name: name.trim(), email: email.trim(), password, orgName: orgName.trim() })})
 const data = await res.json()
 if (!res.ok) throw new Error(data.error || "Registration failed")

 const result = await signIn("credentials", { email: email.trim(), password, redirect: false })
 if (result?.error) throw new Error("Auto-login failed")

 router.push("/setup")
 router.refresh()
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Registration failed")
 } finally { setLoading(false) }
 }

 return (
 <Card>
 <CardHeader className="text-center pb-2">
 <CardTitle>Create Account</CardTitle>
 <p className="text-sm text-muted-foreground mt-1">Set up your organization</p>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
 <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
 <div className="relative">
 <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required minLength={6} />
 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="orgName">Organization Name <span className="text-destructive">*</span></Label>
 <Input id="orgName" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="My Company" required />
 </div>
 <Button type="submit" className="w-full gap-2" loading={loading}>
 <UserPlus className="w-4 h-4" /> Create Account
 </Button>
 </form>
 <p className="text-center text-xs text-muted-foreground mt-4">
 Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
 </p>
 </CardContent>
 </Card>
 )
}
