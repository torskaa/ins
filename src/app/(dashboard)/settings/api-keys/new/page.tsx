"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Key, Copy } from "lucide-react"

export default function NewApiKeyPage() {
 const router = useRouter()
 const [loading, setLoading] = useState(false)
 const [name, setName] = useState("")
 const [permissions, setPermissions] = useState('{"*": {"read": true}}')
 const [expiresAt, setExpiresAt] = useState("")
 const [createdKey, setCreatedKey] = useState<string | null>(null)
 const [copied, setCopied] = useState(false)

 async function handleSubmit(e: React.FormEvent) {
 e.preventDefault()
 if (!name.trim()) { toast.error("Name is required"); return }
 let parsed: any
 try { parsed = JSON.parse(permissions) } catch { toast.error("Invalid JSON"); return }
 setLoading(true)
 try {
 const res = await fetch("/api/api-keys", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ name: name.trim(), permissions: parsed, expiresAt: expiresAt || null }),
 })
 if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed to create") }
 const data = await res.json()
 setCreatedKey(data.raw)
 } catch (err) {
 toast.error(err instanceof Error ? err.message : "Failed to create API key")
 } finally { setLoading(false) }
 }

 async function handleCopy() {
 if (!createdKey) return
 try { await navigator.clipboard.writeText(createdKey); setCopied(true); toast.success("Copied") }
 catch { toast.error("Failed to copy") }
 }

 if (createdKey) {
 return (
 <div className="animate-fade-in max-w-lg mx-auto mt-12">
 <Card>
 <CardHeader><div className="flex items-center gap-2"><CardTitle>API Key Created</CardTitle></div></CardHeader>
 <CardContent className="space-y-4">
 <p className="text-sm text-muted-foreground">This is the only time you will see this key. Copy it now and store it securely.</p>
 <code className="block w-full rounded-lg border border-border bg-muted px-3 py-2.5 font-mono text-xs break-all select-all">{createdKey}</code>
 <div className="flex gap-3">
 <Button onClick={handleCopy} variant="default" className="flex-1 gap-1.5">
 {copied ? "Copied" : "Copy to Clipboard"}
 </Button>
 <Button onClick={() => router.push("/settings/api-keys")} variant="secondary" className="flex-1">I've Saved the Key</Button>
 </div>
 </CardContent>
 </Card>
 </div>
 )
 }

 return (
 <div className="animate-fade-in max-w-2xl pb-28">
 <div className="page-header flex items-center gap-4">
 <Button variant="ghost" size="icon" onClick={() => router.back()}></Button>
 <div><h1>Create API Key</h1><p>Generate a new API key for programmatic access</p></div>
 </div>
 <form onSubmit={handleSubmit} className="space-y-5">
 <Card>
 <CardHeader><div className="flex items-center gap-2"><CardTitle>Key Details</CardTitle></div></CardHeader>
 <CardContent className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
 <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production API Key" required />
 </div>
 <div className="space-y-2">
 <Label htmlFor="permissions">Permissions (JSON)</Label>
 <Textarea id="permissions" value={permissions} onChange={(e) => setPermissions(e.target.value)} className="font-mono text-xs min-h-[150px]" rows={8} />
 </div>
 <div className="space-y-2">
 <Label htmlFor="expiresAt">Expires At (optional)</Label>
 <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
 </div>
 </CardContent>
 </Card>
 <div className="flex items-center justify-end gap-3">
 <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
 <Button loading={loading}>Create API Key</Button>
 </div>
 </form>
 </div>
 )
}
