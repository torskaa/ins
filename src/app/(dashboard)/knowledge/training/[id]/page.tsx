"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { SkeletonDetail } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { ArrowLeft, Eye, Play, GraduationCap, Users, Clock, BookOpen, BarChart3, Award, Layers, CheckCircle2, ChevronRight, FileText, Star } from "lucide-react"

type Program = {
 id: string
 title: string
 type: string
 level: string
 modules: number
 duration: string
 students: number
 progress: number
 description: string
}

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
 ]}

export default function TrainingDetailPage({ params }: { params: Promise<{ id: string }> }) {
 const { id } = use(params)
 const router = useRouter()
 const [program, setProgram] = useState<Program | null>(null)
 const [loading, setLoading] = useState(true)
 const [activeTab, setActiveTab] = useState("overview")

 useEffect(() => {
 setLoading(true)
 fetch(`/api/knowledge/training/${id}`)
 .then((r) => r.json())
 .then((data) => { setProgram(data); setLoading(false) })
 .catch(() => setLoading(false))
 }, [id])

 if (loading) return <SkeletonDetail cards={4} hasChart={true} />
 if (!program) return (
 <div className="animate-fade-in">
 <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => router.push("/knowledge/training")}>
 Back to Training
 </Button>
 <Card><CardContent className="p-8 text-center text-muted-foreground">Program not found</CardContent></Card>
 </div>
 )

 const modules = modulesData[program.id] || program.id === "1" ? modulesData["1"] :
 program.id === "2" ? modulesData["2"] :
 program.id === "3" ? modulesData["3"] :
 program.id === "5" ? modulesData["5"] :
 program.id === "7" ? modulesData["7"] :
 program.id === "12" ? modulesData["12"] :
 program.id === "19" ? modulesData["19"] : []

 const TypeIcon = program.type === "Video" ? Play : program.type === "Workshop" ? Users : GraduationCap
 const levelColor = program.level === "Beginner" ? "outline" : program.level === "Intermediate" ? "secondary" : "default"
 const completedModules = Array.isArray(modules) ? modules.filter((m) => m.completed).length : 0

 return (
 <div className="animate-fade-in">
 <Button variant="ghost" size="sm" className="gap-1.5 mb-4" onClick={() => router.push("/knowledge/training")}>
 Back to Training
 </Button>

 <div className="flex items-start justify-between mb-6">
 <div className="flex items-center gap-4">
 <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center">
 <TypeIcon className="w-7 h-7 text-primary" />
 </div>
 <div>
 <h1 className="text-2xl font-semibold">{program.title}</h1>
 <p className="text-sm text-muted-foreground">{program.description}</p>
 </div>
 </div>
 <div className="flex items-center gap-2 self-start">
 <Badge variant={levelColor as any}>{program.level}</Badge>
 <Badge variant="outline">{program.type}</Badge>
 <Button variant="ghost" size="sm" onClick={() => router.push(`/knowledge/training/${id}/edit`)} className="gap-1.5 h-8">
 Edit
 </Button>
 <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Delete this training program?")) { fetch(`/api/knowledge/training/${id}`, { method: "DELETE" }).then(() => { toast.success("Deleted"); router.push("/knowledge") }).catch(() => toast.error("Failed to delete")) } }} className="gap-1.5 h-8 text-destructive hover:text-destructive">
 Delete
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <Layers className="w-3.5 h-3.5" />
 <p className="text-xs font-medium">Modules</p>
 </div>
 <p className="text-lg font-semibold mt-1">{program.modules}</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <p className="text-xs font-medium">Duration</p>
 </div>
 <p className="text-lg font-semibold mt-1">{program.duration}</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <p className="text-xs font-medium">Enrolled</p>
 </div>
 <p className="text-lg font-semibold mt-1">{program.students}</p>
 </CardContent>
 </Card>
 <Card>
 <CardContent className="p-4">
 <div className="flex items-center gap-2 text-muted-foreground mb-1">
 <Award className="w-3.5 h-3.5" />
 <p className="text-xs font-medium">Progress</p>
 </div>
 <p className="text-lg font-semibold mt-1">{program.progress}%</p>
 </CardContent>
 </Card>
 </div>

 <div className="mb-6">
 <div className="flex items-center justify-between mb-2">
 <span className="text-xs text-muted-foreground">Overall Progress</span>
 <span className="text-xs font-medium">{program.progress}%</span>
 </div>
 <Progress value={program.progress} className="h-2" />
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab}>
 <TabsList>
  <TabsTrigger value="overview" className="gap-1.5">
   <Eye className="w-4 h-4" />
   Overview
  </TabsTrigger>
  <TabsTrigger value="modules" className="gap-1.5">
   <Layers className="w-4 h-4" />
   Modules
 {Array.isArray(modules) && modules.length > 0 && (
 <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0">{completedModules}/{modules.length}</Badge>
 )}
 </TabsTrigger>
  <TabsTrigger value="reviews" className="gap-1.5">
   <Star className="w-4 h-4" />
   Reviews
  </TabsTrigger>
 </TabsList>
 <TabsContent value="overview" className="mt-4 space-y-4">
 <Card>
 <CardContent className="p-5">
 <h3 className="font-medium mb-3 flex items-center gap-2">
 About this program
 </h3>
 <p className="text-sm text-muted-foreground leading-relaxed">{program.description}</p>
 <Separator className="my-4" />
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
 <TabsContent value="modules" className="mt-4">
 <Card>
 <CardHeader>
 <CardTitle className="text-sm font-medium flex items-center justify-between">
 <span>Course Modules</span>
 {Array.isArray(modules) && (
 <Badge variant="outline" className="text-xs">
 {completedModules}/{modules.length} completed
 </Badge>
 )}
 </CardTitle>
 </CardHeader>
 <CardContent>
 {Array.isArray(modules) && modules.length > 0 ? (
 <div className="space-y-2">
 {modules.map((m, i) => (
 <div key={i} className={`p-3 rounded-xl border transition-colors ${m.completed ? "border-success/20 bg-success/5" : "border-border/50"}`}>
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${m.completed ? "bg-success text-white" : "bg-surface text-muted-foreground"}`}>
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
 <div className="text-center py-8 text-muted-foreground">
 <p className="text-sm">Module content coming soon</p>
 </div>
 )}
 </CardContent>
 </Card>
 </TabsContent>
 <TabsContent value="reviews" className="mt-4">
 <Card>
 <CardContent className="p-8 text-center text-muted-foreground">
 <p className="text-sm">No reviews yet</p>
 <p className="text-xs mt-1">Reviews will appear once students complete this program</p>
 <Button variant="outline" size="sm" className="mt-4 gap-1.5">
 Write a Review
 </Button>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>
 )
}
