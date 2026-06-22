"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge, SemanticBadge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Circle, Settings2, XCircle, GitBranch, Layers, Play } from "lucide-react"
import { toast } from "sonner"
import { EmptyState } from "@/components/ui/empty-state"

type Workflow = { id: string; name: string; entityType: string; isActive: boolean; states: WorkflowState[]; transitions: WorkflowTransition[] }
type WorkflowState = { id: string; name: string; color: string; isInitial: boolean; isFinal: boolean }
type WorkflowTransition = { id: string; name: string; fromStateId: string; toStateId: string; requiredRole: string | null; fromState: WorkflowState; toState: WorkflowState }

const ENTITY_TYPES = [{ value: "order", label: "Order" }, { value: "invoice", label: "Invoice" }, { value: "production_order", label: "Production Order" }, { value: "delivery", label: "Delivery" }]

export default function WorkflowsPage() {
 const router = useRouter()
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
 const [showNew, setShowNew] = useState(false)
 const [newForm, setNewForm] = useState({ name: "", entityType: "order" })
 const [selectedWf, setSelectedWf] = useState<Workflow | null>(null)
 const handleNew = useCallback(() => setShowNew((v) => !v), [])
 useHotkey("c", handleNew)
 const [newStateName, setNewStateName] = useState("")
 const [newTransName, setNewTransName] = useState("")
 const [newTransFrom, setNewTransFrom] = useState("")
 const [newTransTo, setNewTransTo] = useState("")

  function load() {
    fetch("/api/workflows").then(r => r.json()).then(json => { if (json?.success && Array.isArray(json.data)) { setWorkflows(json.data); if (selectedWf) setSelectedWf(json.data.find((w: any) => w.id === selectedWf.id) || null) } else if (!json?.success) throw new Error(json?.error || "Failed to load") }).catch((err) => { setError(err.message); setLoading(false) }).finally(() => setLoading(false))
  }

 useEffect(() => { load() }, [])

 async function createWorkflow() {
 if (!newForm.name) return
 const res = await fetch("/api/workflows", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newForm) })
 if (res.ok) { toast.success("Workflow created"); setShowNew(false); setNewForm({ name: "", entityType: "order" }); load() }
 else toast.error("Failed")
 }

 async function addState() {
 if (!newStateName || !selectedWf) return
 const res = await fetch(`/api/workflows/${selectedWf.id}/states`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newStateName }) })
 if (res.ok) { setNewStateName(""); load() }
 else toast.error("Failed")
 }

 async function addTransition() {
 if (!newTransName || !newTransFrom || !newTransTo || !selectedWf) return
 const res = await fetch(`/api/workflows/${selectedWf.id}/transitions`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newTransName, fromStateId: newTransFrom, toStateId: newTransTo }) })
 if (res.ok) { setNewTransName(""); setNewTransFrom(""); setNewTransTo(""); load() }
 else toast.error("Failed")
 }

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div><h1>Workflow Engine</h1><p>Configure status transitions for orders, invoices, and more</p></div>
   <Button onClick={handleNew} className="gap-1.5">New Workflow <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd></Button>
 </div>

 {showNew && (
 <Card className="mb-6 border-primary/30">
 <CardContent className="p-4 space-y-3">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1"><Label>Name</Label><Input value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} placeholder="Order Workflow" /></div>
 <div className="space-y-1"><Label>Entity Type</Label><Select options={ENTITY_TYPES} value={newForm.entityType} onChange={(e: any) => setNewForm({ ...newForm, entityType: e.target.value })} /></div>
 </div>
 <div className="flex justify-end gap-2 pt-2"><Button variant="ghost" onClick={() => setShowNew(false)}><XCircle className="w-4 h-4" /> Cancel</Button><Button onClick={createWorkflow}>Create</Button></div>
 </CardContent>
 </Card>
 )}

  {error ? (
    <EmptyState
      variant="error"
      title="Failed to load data"
      description={error}
      actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
    />
  ) : (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="space-y-3">
 <h3 className="text-sm font-medium text-muted-foreground">Workflows ({workflows.length})</h3>
 {workflows.map(wf => (
 <Card key={wf.id} className={`cursor-pointer transition-colors hover:bg-surface/50 ${selectedWf?.id === wf.id ? "ring-2 ring-primary" : ""}`} onClick={() => setSelectedWf(wf)}>
 <CardContent className="p-4">
 <div className="flex items-center justify-between"><span className="font-medium">{wf.name}</span><SemanticBadge semantic={wf.entityType} category="type">{wf.entityType}</SemanticBadge></div>
 <p className="text-xs text-muted-foreground mt-1">{wf.states?.length || 0} states · {wf.transitions?.length || 0} transitions</p>
 </CardContent>
 </Card>
 ))}
  {workflows.length === 0 && !loading && <EmptyState icons={[<GitBranch key="wf1" className="w-6 h-6" />, <Layers key="wf2" className="w-6 h-6" />, <Play key="wf3" className="w-6 h-6" />]} title="No workflows configured yet" description="Create your first workflow to automate business processes" size="sm" />}
 </div>

 <div className="lg:col-span-2">
 {selectedWf ? (
 <div className="space-y-6">
 <Card><CardHeader className="pb-2"><CardTitle className="flex items-center gap-2">{selectedWf.name} <SemanticBadge semantic={selectedWf.entityType} category="type">{selectedWf.entityType}</SemanticBadge></CardTitle></CardHeader>
 <CardContent>
 <div className="flex flex-wrap gap-2 mb-4">
 {selectedWf.states?.map(s => (
 <div key={s.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm" style={{ backgroundColor: s.color + "20", color: s.color, border: `1px solid ${s.color}40` }}>
 <Circle className="w-2.5 h-2.5" style={{ fill: s.color }} />{s.name}{s.isInitial ? " (start)" : ""}{s.isFinal ? " (end)" : ""}
 </div>
 ))}
 </div>
 <Separator className="my-3" />
 <div className="text-xs text-muted-foreground mb-3">Transitions:</div>
 {selectedWf.transitions?.map(t => (
 <div key={t.id} className="flex items-center gap-2 text-sm py-1">
 <span>{t.fromState?.name || "?"}</span><span>{t.toState?.name || "?"}</span>
 <Badge variant="outline" className="text-xs ml-1">{t.name}</Badge>
 </div>
 ))}
 </CardContent>
 </Card>

 <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Add State</CardTitle></CardHeader>
 <CardContent><div className="flex gap-2"><Input value={newStateName} onChange={(e) => setNewStateName(e.target.value)} placeholder="State name" className="flex-1" /><Button size="sm" onClick={addState}>Add</Button></div></CardContent>
 </Card>

 <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Add Transition</CardTitle></CardHeader>
 <CardContent className="space-y-2">
 <div className="grid grid-cols-4 gap-2">
 <Select options={selectedWf.states?.map(s => ({ value: s.id, label: s.name })) || []} value={newTransFrom} onChange={(e: any) => setNewTransFrom(e.target.value)} placeholder="From" />
 <Select options={selectedWf.states?.map(s => ({ value: s.id, label: s.name })) || []} value={newTransTo} onChange={(e: any) => setNewTransTo(e.target.value)} placeholder="To" />
 <Input value={newTransName} onChange={(e) => setNewTransName(e.target.value)} placeholder="Action name" />
 <Button size="sm" onClick={addTransition}>Add</Button>
 </div>
 </CardContent>
 </Card>
 </div>
 ) : (
 <Card><CardContent className="p-12 text-center"><Settings2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium">Select a Workflow</h3><p className="text-sm text-muted-foreground">Choose a workflow from the left to view or edit its states and transitions.</p></CardContent></Card>
 )}
   </div>
   </div>
    )}
    </div>
    )
}
