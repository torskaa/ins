"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge, BadgeDot, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { AlertTriangle, Award, BookOpen, Clock, FileText, GraduationCap, Hash, Layers, Pencil, Play, Star, Trash2, Users, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { formatDate, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

const modulesData: Record<string, { title: string; duration: string; completed: boolean }[]> = {
  "1": [
    { title: "Introduction to Inventory", duration: "20 min", completed: true },
    { title: "Stock Tracking Methods", duration: "25 min", completed: true },
    { title: "Setting Reorder Points", duration: "15 min", completed: true },
    { title: "Cycle Counting", duration: "20 min", completed: true },
    { title: "Inventory Reports", duration: "20 min", completed: true },
    { title: "Final Assessment", duration: "20 min", completed: true },
  ],
  "2": [
    { title: "Order Lifecycle Overview", duration: "15 min", completed: true },
    { title: "Creating Orders", duration: "20 min", completed: true },
    { title: "Processing & Fulfillment", duration: "25 min", completed: false },
    { title: "Order Status Management", duration: "15 min", completed: false },
  ],
  "3": [
    { title: "CRM Fundamentals", duration: "30 min", completed: true },
    { title: "Contact Management", duration: "25 min", completed: true },
    { title: "Pipeline Tracking", duration: "35 min", completed: false },
    { title: "Customer Analytics", duration: "30 min", completed: false },
    { title: "Communication Log", duration: "20 min", completed: false },
    { title: "Advanced CRM Features", duration: "40 min", completed: false },
    { title: "Reporting & Insights", duration: "25 min", completed: false },
    { title: "Final Assessment", duration: "15 min", completed: false },
  ],
  "5": [
    { title: "Platform Overview", duration: "10 min", completed: true },
    { title: "Navigating the Interface", duration: "15 min", completed: true },
    { title: "Core Modules", duration: "20 min", completed: true },
    { title: "Daily Workflows", duration: "15 min", completed: true },
    { title: "Tips & Shortcuts", duration: "10 min", completed: false },
  ],
  "7": [
    { title: "Warehouse Safety Basics", duration: "20 min", completed: true },
    { title: "Hazard Identification", duration: "25 min", completed: true },
    { title: "Emergency Procedures", duration: "20 min", completed: true },
    { title: "Safety Checklist", duration: "15 min", completed: true },
  ],
  "12": [
    { title: "Understanding Customer Needs", duration: "25 min", completed: true },
    { title: "Communication Skills", duration: "30 min", completed: true },
    { title: "Handling Complaints", duration: "20 min", completed: true },
    { title: "Building Relationships", duration: "25 min", completed: true },
    { title: "Service Excellence", duration: "20 min", completed: false },
  ],
  "19": [
    { title: "Why Forecasting Matters", duration: "20 min", completed: true },
    { title: "Basic Forecasting Methods", duration: "25 min", completed: true },
    { title: "Using Historical Data", duration: "20 min", completed: true },
    { title: "Forecasting in Ins", duration: "15 min", completed: false },
  ],
}

function FieldDisplay({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] text-muted-foreground font-medium mb-0.5 truncate">{label}</p>
      {badge ? (
        <SemanticBadge semantic={value} category="status">{value}</SemanticBadge>
      ) : (
        <p className={cn("text-sm truncate", mono ? "font-mono" : "font-medium")}>{value || "—"}</p>
      )}
    </div>
  )
}

function FieldGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="min-w-0 space-y-1">
      <Label className="text-[11px] text-muted-foreground font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )
}

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [program, setProgram] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tab, setTab] = useState("overview")
  const [form, setForm] = useState<any>({})
  const [id, setId] = useState<string>("")

  useEffect(() => {
    params.then(({ id }) => setId(id))
  }, [params])

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/knowledge/training/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json?.success) throw new Error(json?.error || "Failed to load")
        const data = json.data
        setProgram(data)
        setForm({
          title: data.title,
          type: data.type,
          level: data.level,
          description: data.description || "",
          duration: data.duration,
          modules: String(data.modules),
        })
      })
      .catch((err) => { setError(err.message); setLoading(false) })
      .finally(() => setLoading(false))
  }, [id])

  if (error) return (
    <div className="animate-fade-in pb-8 space-y-4">
      <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
    </div>
  )

  if (loading) return <SkeletonDetail cards={4} hasChart={true} />

  if (!program) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Program not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The training program you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/knowledge/training")}>Back to Training</Button>
      </div>
    )
  }

  const modules = modulesData[program.id] || (
    program.id === "1" ? modulesData["1"] :
    program.id === "2" ? modulesData["2"] :
    program.id === "3" ? modulesData["3"] :
    program.id === "5" ? modulesData["5"] :
    program.id === "7" ? modulesData["7"] :
    program.id === "12" ? modulesData["12"] :
    program.id === "19" ? modulesData["19"] : []
  )

  const TypeIcon = program.type === "Video" ? Play : program.type === "Workshop" ? Users : GraduationCap
  const completedModules = Array.isArray(modules) ? modules.filter((m: any) => m.completed).length : 0

  async function handleSave() {
    try {
      const res = await fetch(`/api/knowledge/training/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          modules: parseInt(form.modules) || 0,
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const updated = await res.json()
      setProgram(updated)
      setShowEdit(false)
      toast.success("Program updated")
    } catch {
      toast.error("Failed to update program")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/knowledge/training/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Program deleted")
      router.push("/knowledge/training")
      router.refresh()
    } catch {
      toast.error("Failed to delete program")
      setDeleting(false)
    }
  }

  const moduleColumns = [
    { key: "index", label: "#", render: (_: any, i: number) => <span className="text-muted-foreground text-xs">{i + 1}</span> },
    { key: "title", label: "Module", render: (item: any) => <span className="font-medium">{item.title}</span> },
    { key: "duration", label: "Duration", render: (item: any) => <span className="text-muted-foreground">{item.duration}</span> },
    { key: "status", label: "Status", render: (item: any) => item.completed ? <SemanticBadge semantic="completed" category="status" className="">Completed</SemanticBadge> : <SemanticBadge semantic="pending" category="status" className="">Pending</SemanticBadge> },
  ]

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <button onClick={() => router.push("/knowledge/training")}>Training</button>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{program.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="w-14 self-stretch rounded-lg bg-primary/5 border border-border/60 flex items-center justify-center shrink-0">
                <TypeIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{program.title}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={program.level} category="status" className="gap-1 text-[11px]"><BadgeDot />{program.level}</SemanticBadge>
                  <SemanticBadge semantic={program.type} category="type" className="gap-1 text-[11px]" />
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{program.duration} · {program.modules} modules · {program.students} enrolled</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => setShowEdit(true)} className="h-9 gap-1.5">Edit <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘E</kbd></Button>
                <MoreMenu actions={[
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="w-4 h-4 text-primary" />
                Program Description
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Title" value={program.title} />
                <FieldDisplay label="Type" value={program.type} />
                <FieldDisplay label="Level" value={program.level} />
                <FieldDisplay label="Duration" value={program.duration} />
                <FieldDisplay label="Modules" value={String(program.modules)} mono />
                <FieldDisplay label="Students Enrolled" value={String(program.students)} />
                {program.description && (
                  <div className="col-span-2">
                    <p className="text-[11px] text-muted-foreground font-medium mb-0.5">Description</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{program.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Award className="w-4 h-4 text-primary" />
                Progress Overview
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-semibold font-mono">{program.progress}%</span>
                <span className="text-xs text-muted-foreground">complete</span>
              </div>
              <Progress className="h-1.5 mb-2" value={program.progress} />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{completedModules} modules done</span>
                <span>{program.modules} total</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Layers className="w-4 h-4 text-primary" />
                Classification
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5"><GraduationCap className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Type</span><span className="text-sm font-medium ml-auto">{program.type}</span></div>
                <div className="flex items-center gap-2.5"><Award className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Level</span><span className="text-sm font-medium ml-auto">{program.level}</span></div>
                <div className="flex items-center gap-2.5"><Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Duration</span><span className="text-sm font-medium ml-auto">{program.duration}</span></div>
                <div className="flex items-center gap-2.5"><Users className="w-3.5 h-3.5 text-muted-foreground shrink-0" /><span className="text-xs text-muted-foreground">Students</span><span className="text-sm font-medium ml-auto">{program.students}</span></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="overview" className="gap-1.5"><BookOpen className="w-4 h-4" /> Overview</TabsTrigger>
            <TabsTrigger value="modules" className="gap-1.5">
              <Layers className="w-4 h-4" /> Modules
              {Array.isArray(modules) && modules.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{completedModules}/{modules.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5"><Star className="w-4 h-4" /> Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="p-3">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  About this program
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{program.description}</p>
                <div className="border-t border-border/60 my-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Program Type</p>
                    <p className="text-sm font-medium">{program.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Difficulty Level</p>
                    <p className="text-sm font-medium">{program.level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Modules</p>
                    <p className="text-sm font-medium">{program.modules}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Duration</p>
                    <p className="text-sm font-medium">{program.duration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Students Enrolled</p>
                    <p className="text-sm font-medium">{program.students}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                    <p className="text-sm font-medium">{program.progress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="p-3">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Layers className="w-4 h-4 text-primary" />
                    Course Modules
                  </div>
                  {Array.isArray(modules) && (
                    <Badge variant="outline" className="text-xs">
                      {completedModules}/{modules.length} completed
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {Array.isArray(modules) && modules.length > 0 ? (
                  <div className="space-y-2">
                    {modules.map((m: any, i: number) => (
                      <div key={i} className={`p-3 rounded-xl border transition-colors ${m.completed ? "border-success/20 bg-success/5" : "border-border/50"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${m.completed ? "bg-success text-primary-foreground" : "bg-surface text-muted-foreground"}`}>
                              {m.completed ? null : i + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{m.title}</p>
                              <p className="text-xs text-muted-foreground">{m.duration}</p>
                            </div>
                          </div>
                          <Button variant={m.completed ? "ghost" : "outline"} size="sm" className="gap-1">
                            {m.completed ? "Replay" : "Start"}
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-center pt-4">
                      <Button className="gap-1.5">
                        {program.progress === 100 ? "Review All" : "Continue Learning"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EmptyState
                    icons={[<BookOpen key="cm1" className="w-6 h-6" />, <FileText key="cm2" className="w-6 h-6" />, <Layers key="cm3" className="w-6 h-6" />]}
                    title="Module content coming soon"
                    description="Learning materials for this module are being prepared"
                    size="sm"
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="p-3">
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  icons={[<Star key="rv1" className="w-6 h-6" />, <FileText key="rv2" className="w-6 h-6" />, <Award key="rv3" className="w-6 h-6" />]}
                  title="No reviews yet"
                  description="Reviews will appear once students complete this program"
                  actions={[{ label: "Write a Review", onClick: () => {} }]}
                  size="sm"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{program?.title}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <GraduationCap className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Title" required><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Type">
                    <Select options={[
                      { value: "Video", label: "Video" },
                      { value: "Workshop", label: "Workshop" },
                      { value: "Course", label: "Course" },
                      { value: "Certification", label: "Certification" },
                    ]} value={form.type} onChange={(e: any) => setForm({ ...form, type: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Level">
                    <Select options={[
                      { value: "Beginner", label: "Beginner" },
                      { value: "Intermediate", label: "Intermediate" },
                      { value: "Advanced", label: "Advanced" },
                    ]} value={form.level} onChange={(e: any) => setForm({ ...form, level: e.target.value })} />
                  </FieldGroup>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Duration"><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 2 hours" /></FieldGroup>
                  <FieldGroup label="Modules"><Input type="number" value={form.modules} onChange={(e) => setForm({ ...form, modules: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{program.title}</strong>? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}><XCircle className="w-4 h-4" /> Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} loading={deleting}><Trash2 className="w-4 h-4" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
