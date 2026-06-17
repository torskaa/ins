"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import Link from "next/link"

function LoginForm() {
 const router = useRouter()
 const searchParams = useSearchParams()
 const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
 const [loading, setLoading] = useState(false)
 const [showPassword, setShowPassword] = useState(false)
 const [email, setEmail] = useState("admin@ins.com")
 const [password, setPassword] = useState("password123")

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!email.trim() || !password) { toast.error("Email and password required"); return }
 setLoading(true)
 try {
 const result = await signIn("credentials", { email: email.trim(), password, redirect: false })
 if (result?.error) {
 toast.error("Invalid email or password")
 return
 }
 router.push(callbackUrl)
 router.refresh()
 } catch {
 toast.error("Login failed")
 } finally { setLoading(false) }
 }

 return (
 <Card>
 <CardHeader className="text-center pb-2">
 <CardTitle>Sign In</CardTitle>
 <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
 </CardHeader>
 <CardContent>
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="email">Email</Label>
 <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@ins.com" required autoFocus />
 </div>
 <div className="space-y-2">
 <Label htmlFor="password">Password</Label>
 <div className="relative">
 <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password123" required />
 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 </div>
 <Button type="submit" className="w-full gap-2" loading={loading}>Sign In
 </Button>
 </form>
 <p className="text-center text-xs text-muted-foreground mt-4">
 Don't have an account? <Link href="/register" className="text-primary hover:underline font-medium">Create one</Link>
 </p>
 </CardContent>
 </Card>
 )
}

export default function LoginPage() {
 return (
 <Suspense fallback={<Card><CardContent className="p-8 text-center text-muted-foreground">Loading...</CardContent></Card>}>
 <LoginForm />
 </Suspense>
 )
}
