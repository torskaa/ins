"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Copy, Key, XCircle } from "lucide-react"

const Field = ({ id, label, required, children, className }: { id?: string; label: React.ReactNode; required?: boolean; children: React.ReactNode; className?: string }) => (
  <div className={cn("space-y-1", className)}>
    <Label htmlFor={id} className="text-xs font-medium">{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
    {children}
  </div>
)

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
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to create")
      setCreatedKey(json.data.raw)
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
      <div className="animate-fade-in pb-28">
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span className="text-sm font-semibold">API Key Created</span>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
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
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-28">
      <div className="page-header flex items-center gap-4 mb-5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => router.back()}></Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
          <p className="text-sm font-medium">Back</p>
          <p className="text-background/70 text-xs leading-snug">
            Go back to API keys list
          </p>
        </TooltipContent>
        </Tooltip>
        <div><h1>Create API Key</h1><p>Generate a new API key for programmatic access</p></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8 flex flex-col gap-4">
            <Card className="flex-1">
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  <span className="text-sm font-semibold">Key Details</span>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Field id="name" label="Name" required>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production API Key" required />
                </Field>
                <Field id="permissions" label="Permissions (JSON)">
                  <Textarea id="permissions" value={permissions} onChange={(e) => setPermissions(e.target.value)} className="font-mono text-xs min-h-[150px]" rows={8} />
                </Field>
                <Field id="expiresAt" label="Expires At (optional)">
                  <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
                </Field>
              </CardContent>
            </Card>
            <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => router.back()}><XCircle className="w-4 h-4" /> Cancel</Button>
              <Button loading={loading}>Create API Key</Button>
            </div>
          </div>
          <div className="col-span-4 flex flex-col gap-4" />
        </div>
      </form>
    </div>
  )
}
