"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { FolderKanban, Trash2, XCircle } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type Project = { id: string; name: string; description: string; status: string; priority: string; startDate: string; dueDate: string; completedDate: string; budget: number; actualCost: number; tasks: Task[] }
type Task = { id: string; title: string; description: string; status: string; priority: string; assigneeId: string; dueDate: string; estimatedHours: number; actualHours: number }

const STATUS_COLORS: Record<string, string> = { draft: "bg-slate-100 text-slate-700", active: "bg-blue-100 text-blue-700", paused: "bg-orange-100 text-orange-700", completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-700" }
const TASK_STATUS_COLORS: Record<string, string> = { todo: "bg-slate-100 text-slate-600", in_progress: "bg-blue-100 text-blue-700", review: "bg-purple-100 text-purple-700", done: "bg-emerald-100 text-emerald-700" }
const PRIORITY_COLORS: Record<string, string> = { low: "text-slate-500", medium: "text-blue-500", high: "text-orange-500", urgent: "text-red-500" }

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const router = useRouter()
 const { id } = use(params)
 const [project, setProject] = useState<Project | null>(null)
 const [loading, setLoading] = useState(true)
 const [showAddTask, setShowAddTask] = useState(false)
 const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "medium", dueDate: "", estimatedHours: "0" })

 function loadProject() {
 fetch(`/api/projects/${id}`).then(r => r.json()).then(d => { if (d && !d.error) setProject(d); else toast.error("Project not found") }).finally(() => setLoading(false))
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

 if (loading) return <Skeleton className="h-96 w-full rounded-xl" />
 if (!project) return <div className="animate-fade-in"><p>Project not found</p><Button variant="secondary" onClick={() => router.push("/projects")}>Back</Button></div>

 const completedTasks = project.tasks.filter(t => t.status === "done").length
 const totalTasks = project.tasks.length
 const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

 return (
 <div className="animate-fade-in">
 <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">Back</button>

 <div className="page-header flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2"><h1>{project.name}</h1><Badge className={STATUS_COLORS[project.status]}>{project.status}</Badge></div>
 <p className="text-muted-foreground text-sm capitalize">{project.priority} priority{project.dueDate ? ` · Due ${formatDate(new Date(project.dueDate))}` : ""}</p>
 </div>
 <div className="flex items-center gap-2">
 {project.status !== "completed" && project.status !== "cancelled" && (
 <div className="flex items-center gap-1">
 {project.status === "draft" && <Button variant="secondary" size="sm" onClick={() => updateStatus("active")}>Start Project</Button>}
 {project.status === "active" && <><Button variant="secondary" size="sm" onClick={() => updateStatus("paused")}>Pause</Button><Button variant="default" size="sm" onClick={() => updateStatus("completed")}>Complete</Button></>}
 {project.status === "paused" && <Button variant="secondary" size="sm" onClick={() => updateStatus("active")}>Resume</Button>}
 </div>
 )}
 <Button variant="ghost" size="sm" onClick={() => router.push(`/projects/${id}/edit`)} className="gap-1.5">Edit</Button>
 <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Delete project?")) fetch(`/api/projects/${id}`, { method: "DELETE" }).then(() => { toast.success("Deleted"); router.push("/projects") }) }} className="gap-1.5 text-destructive"><Trash2 className="w-4 h-4" /> Delete</Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
 <Card><CardContent className="p-4 text-center"><div className="flex items-center justify-center gap-2"><p className="text-2xl font-semibold">{completedTasks}/{totalTasks}</p></div><p className="text-xs text-muted-foreground">Tasks Completed</p></CardContent></Card>
 <Card><CardContent className="p-4 text-center"><div className="flex items-center justify-center gap-2"><p className="text-2xl font-semibold">{project.tasks.reduce((s, t) => s + t.estimatedHours, 0)}h</p></div><p className="text-xs text-muted-foreground">Estimated Hours</p></CardContent></Card>
 <Card><CardContent className="p-4 text-center"><p className="text-2xl font-semibold">{formatCurrency(project.budget)}</p><p className="text-xs text-muted-foreground">Budget</p></CardContent></Card>
 <Card><CardContent className="p-4 text-center"><div className="w-full bg-surface rounded-full h-2 mt-1 mb-1"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div><p className="text-xs text-muted-foreground">{progress}% Complete</p></CardContent></Card>
 </div>

 {project.description && <Card className="mb-6"><CardContent className="p-4"><p className="text-sm">{project.description}</p></CardContent></Card>}

 <Card><CardHeader className="flex flex-row items-center justify-between">
 <CardTitle className="flex items-center gap-2"><FolderKanban className="w-4 h-4" /> Tasks ({totalTasks})</CardTitle>
 <Button variant="secondary" size="sm" onClick={() => setShowAddTask(!showAddTask)} className="gap-1">Add Task</Button>
 </CardHeader>
 <CardContent className="space-y-3">
 {showAddTask && (
 <form onSubmit={addTask} className="p-4 rounded-xl bg-surface/50 space-y-3 mb-4">
 <div className="space-y-2"><Label>Title</Label><Input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} placeholder="Task title" /></div>
 <div className="grid grid-cols-3 gap-3">
 <div className="space-y-2"><Label>Priority</Label><Select options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} value={taskForm.priority} onChange={(e: any) => setTaskForm({ ...taskForm, priority: e.target.value })} /></div>
 <div className="space-y-2"><Label>Due</Label><Input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></div>
 <div className="space-y-2"><Label>Hours</Label><Input type="number" min="0" value={taskForm.estimatedHours} onChange={(e) => setTaskForm({ ...taskForm, estimatedHours: e.target.value })} /></div>
 </div>
 <div className="flex justify-end gap-2 pt-2"><Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTask(false)}><XCircle className="w-4 h-4" /> Cancel</Button><Button type="submit" size="sm">Add</Button></div>
 </form>
 )}

 {project.tasks.map(task => (
 <div key={task.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-surface/50 transition-colors">
 <div className="flex items-center gap-3 flex-1 min-w-0">
 <button onClick={() => updateTask(task.id, task.status === "done" ? "todo" : "done")} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${task.status === "done" ? "bg-emerald-500 border-emerald-500 text-white" : "border-muted-foreground"}`}>{task.status === "done" && <span>✓</span>}</button>
 <div className="min-w-0"><p className={`text-sm font-medium truncate ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
 <p className="text-xs text-muted-foreground">{task.status.replace("_", " ")} · {task.estimatedHours}h{task.dueDate ? ` · Due ${formatDate(new Date(task.dueDate))}` : ""}</p></div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <Badge variant="outline" className={PRIORITY_COLORS[task.priority]}>{task.priority}</Badge>
 <Badge className={TASK_STATUS_COLORS[task.status]}>{task.status.replace("_", " ")}</Badge>
 <button onClick={() => deleteTask(task.id)} className="text-muted-foreground hover:text-destructive transition-colors"></button>
 </div>
 </div>
 ))}
 {totalTasks === 0 && <p className="text-center text-sm text-muted-foreground py-8">No tasks yet. Click "Add Task" to get started.</p>}
 </CardContent>
 </Card>
 </div>
 )
}
