"use client"

import { useState, useEffect, use } from "react"
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
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock, DollarSign, Flag, FolderKanban, Hash, HouseIcon, ListTodo, Pencil, Trash2, XCircle } from "lucide-react"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Frame, FramePanel } from "@/components/reui/frame"
import { formatCurrency, formatNumber, formatDate, formatDateTime, cn } from "@/lib/utils"
import { toast } from "sonner"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { MoreMenu } from "@/components/ui/more-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/ui/dialog"

type Project = { id: string; name: string; description: string; status: string; priority: string; startDate: string; dueDate: string; completedDate: string; budget: number; actualCost: number; tasks: Task[] }
type Task = { id: string; title: string; description: string; status: string; priority: string; assigneeId: string; dueDate: string; estimatedHours: number; actualHours: number }

const PRIORITY_COLORS: Record<string, string> = { low: "text-muted-foreground", medium: "text-info", high: "text-warning", urgent: "text-destructive" }

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

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", dueDate: "", estimatedHours: "0" })
  const [form, setForm] = useState<any>({})

  function loadProject() {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(json => { if (json?.success && json.data) { const d = json.data; setProject(d); setForm({ name: d.name, description: d.description || "", status: d.status, priority: d.priority, startDate: d.startDate || "", dueDate: d.dueDate || "", budget: String(d.budget) }) } else toast.error(json?.error || "Project not found") }).catch((err) => { setError(err.message) }).finally(() => setLoading(false))
  }

  useEffect(() => { loadProject() }, [id])

  async function updateStatus(status: string) {
    const res = await fetch(`/api/projects/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...project, status }) })
    if (res.ok) { toast.success(`Project ${status}`); loadProject() } else toast.error("Failed to update")
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskForm.title) return
    const res = await fetch(`/api/projects/${id}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(taskForm) })
    if (res.ok) { toast.success("Task added"); setTaskForm({ title: "", description: "", priority: "medium", dueDate: "", estimatedHours: "0" }); setShowAddTask(false); loadProject() }
    else toast.error("Failed to add task")
  }

  async function updateTask(taskId: string, status: string) {
    const res = await fetch(`/api/tasks/${taskId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    if (res.ok) loadProject(); else toast.error("Failed to update task")
  }

  async function deleteTask(taskId: string) {
    if (!window.confirm("Delete this task?")) return
    await fetch(`/api/tasks/${taskId}`, { method: "DELETE" })
    loadProject()
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budget: parseFloat(form.budget) || 0 }),
      })
      if (!res.ok) throw new Error("Failed")
      toast.success("Project updated")
      setShowEdit(false)
      loadProject()
    } catch {
      toast.error("Failed to update project")
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed")
      toast.success("Project deleted")
      router.push("/projects")
      router.refresh()
    } catch {
      toast.error("Failed to delete project")
      setDeleting(false)
    }
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load data"
        description={error}
        actions={[{ label: "Try again", onClick: () => window.location.reload() }]}
      />
    )
  }

  if (loading) return <SkeletonDetail cards={3} hasChart={true} />

  if (!project) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center py-24 gap-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Project not found</h2>
          <p className="text-sm text-muted-foreground mt-1">The project you are looking for does not exist or has been removed.</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/projects")}>Back to Projects</Button>
      </div>
    )
  }

  const completedTasks = project.tasks.filter(t => t.status === "done").length
  const totalTasks = project.tasks.length
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="animate-fade-in pb-8 space-y-4">
      <Frame variant="ghost" className="w-fit">
        <FramePanel className="gap-2 px-3! py-2! border-0!">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/projects" className="flex items-center gap-1.5">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold">{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </FramePanel>
      </Frame>
      <div className="grid grid-cols-12 gap-4">
        {/* Page Header */}
        <div className="col-span-12 border border-border/60 rounded-lg bg-card p-4">
          <div className="flex items-start justify-between gap-6">
            <div className="flex gap-3 min-w-0 flex-1">
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold">{project.name}</h1>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <SemanticBadge semantic={project.status} category="status" className="gap-1 text-[11px]"><BadgeDot />{project.status}</SemanticBadge>
                  <span className={`text-xs font-medium ${PRIORITY_COLORS[project.priority] || "text-muted-foreground"}`}>
                    <Flag className="w-3 h-3 inline mr-1" />
                    {project.priority} priority
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {project.dueDate && <><CalendarDays className="w-3.5 h-3.5" /><span>Due {formatDate(new Date(project.dueDate))}</span></>}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                {project.status !== "completed" && project.status !== "cancelled" && (
                  <div className="flex items-center gap-1">
                    {project.status === "draft" && <Button variant="outline" size="sm" onClick={() => updateStatus("active")}>Start Project</Button>}
                    {project.status === "active" && <><Button variant="outline" size="sm" onClick={() => updateStatus("paused")}>Pause</Button><Button variant="default" size="sm" onClick={() => updateStatus("completed")}>Complete</Button></>}
                    {project.status === "paused" && <Button variant="outline" size="sm" onClick={() => updateStatus("active")}>Resume</Button>}
                  </div>
                )}
                <MoreMenu actions={[
                  { label: "Edit", icon: <Pencil className="w-4 h-4" />, onClick: () => setShowEdit(true) },
                  "separator",
                  { label: "Delete", icon: <Trash2 className="w-4 h-4" />, onClick: () => setShowDelete(true) },
                ]} />
              </div>
            </div>
          </div>
        </div>

        {/* Left Column (8 cols) */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
          {/* KPI Stats */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
                  <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium">Tasks Completed</p>
                  <p className="text-2xl font-semibold">{completedTasks}/{totalTasks}</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium">Estimated Hours</p>
                  <p className="text-2xl font-semibold">{project.tasks.reduce((s, t) => s + t.estimatedHours, 0)}h</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
                  <DollarSign className="w-5 h-5 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium">Budget</p>
                  <p className="text-2xl font-semibold">{formatCurrency(project.budget)}</p>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60">
                  <ListTodo className="w-5 h-5 text-muted-foreground" />
                  <p className="text-[11px] text-muted-foreground font-medium">Progress</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{progress}% Complete</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {project.description && (
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FolderKanban className="w-4 h-4 text-primary" />
                  Description
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm">{project.description}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (4 cols) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          {/* Summary */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FolderKanban className="w-4 h-4 text-primary" />
                Summary
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <FieldDisplay label="Status" value={project.status} />
              <FieldDisplay label="Priority" value={project.priority} />
              <FieldDisplay label="Budget" value={formatCurrency(project.budget)} mono />
              <FieldDisplay label="Actual Cost" value={formatCurrency(project.actualCost)} mono />
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarDays className="w-4 h-4 text-primary" />
                Timeline
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              {project.startDate && <FieldDisplay label="Start Date" value={formatDate(new Date(project.startDate))} />}
              {project.dueDate && <FieldDisplay label="Due Date" value={formatDate(new Date(project.dueDate))} />}
              {project.completedDate && <FieldDisplay label="Completed" value={formatDate(new Date(project.completedDate))} />}
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card className="flex-1">
            <CardHeader className="px-4 pt-4 pb-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" />
                Metadata
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                <FieldDisplay label="Tasks Total" value={String(totalTasks)} />
                <FieldDisplay label="Tasks Completed" value={String(completedTasks)} />
                <FieldDisplay label="Progress" value={`${progress}%`} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tab Module */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden pt-8">
        <Tabs defaultValue="tasks">
          <TabsList className="w-full overflow-x-auto px-4">
            <TabsTrigger value="tasks" className="gap-1.5"><ListTodo className="w-4 h-4" /> Tasks ({totalTasks})</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="pt-8 px-3 pb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <ListTodo className="w-4 h-4 text-primary" />
                Tasks ({totalTasks})
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowAddTask(!showAddTask)} className="gap-1">Add Task</Button>
            </div>
            {showAddTask && (
              <form onSubmit={addTask} className="p-4 rounded-xl bg-surface/50 space-y-3 mb-4">
                <div className="space-y-1"><Label>Title</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Priority</Label><Select options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} value={taskForm.priority} onChange={(e: any) => setTaskForm({ ...taskForm, priority: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Due</Label><Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
                  <div className="space-y-1"><Label>Hours</Label><Input type="number" min="0" value={taskForm.estimatedHours} onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })} /></div>
                </div>
                <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTask(false)}><XCircle className="w-4 h-4" /> Cancel</Button><Button type="submit" size="sm">Add</Button></div>
              </form>
            )}
            {totalTasks === 0 ? (
              <EmptyState
                icons={[<ListTodo key="j1" className="w-6 h-6" />, <CheckCircle2 key="j2" className="w-6 h-6" />, <FolderKanban key="j3" className="w-6 h-6" />]}
                title="No tasks yet"
                description='Click "Add Task" to get started'
                size="sm"
              />
            ) : (
              <div className="space-y-2">
                {project.tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-surface/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button onClick={() => updateTask(task.id, task.status === "done" ? "todo" : "done")} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${task.status === "done" ? "bg-success border-success text-primary-foreground" : "border-muted-foreground"}`}>{task.status === "done" && <span>✓</span>}</button>
                      <div className="min-w-0"><p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.status.replace("_", " ")} · {task.estimatedHours}h{task.dueDate ? ` · Due ${formatDate(new Date(task.dueDate))}` : ""}</p></div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || ""}`}>{task.priority}</span>
                      <SemanticBadge semantic={task.status} category="status">{task.status.replace("_", " ")}</SemanticBadge>
                      <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-2xl flex flex-col p-0 gap-0 max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-0 shrink-0">
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update details for <span className="font-medium text-foreground">{project?.name}</span></DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <FolderKanban className="w-4 h-4 text-primary" />
                  Basic Information
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <FieldGroup label="Name" required><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></FieldGroup>
                <FieldGroup label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></FieldGroup>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Status">
                    <Select options={[{ value: "draft", label: "Draft" }, { value: "active", label: "Active" }, { value: "paused", label: "Paused" }, { value: "completed", label: "Completed" }, { value: "cancelled", label: "Cancelled" }]} value={form.status} onChange={(e: any) => setForm({ ...form, status: e.target.value })} />
                  </FieldGroup>
                  <FieldGroup label="Priority">
                    <Select options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} value={form.priority} onChange={(e: any) => setForm({ ...form, priority: e.target.value })} />
                  </FieldGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 pt-4 pb-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarDays className="w-4 h-4 text-primary" />
                  Timeline & Budget
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup label="Start Date"><Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} /></FieldGroup>
                  <FieldGroup label="Due Date"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></FieldGroup>
                </div>
                <FieldGroup label="Budget"><Input type="number" step="0.01" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} /></FieldGroup>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="shrink-0 px-6 py-4 border-t border-border/60">
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Changes <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘↵</kbd></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>Are you sure you want to delete <strong>{project.name}</strong>? This action cannot be undone.</DialogDescription>
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
