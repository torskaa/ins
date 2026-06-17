"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Search, Play, GraduationCap, FileText, BarChart3, Clock, Users, Plus } from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton"

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

export default function TrainingPage() {
 const router = useRouter()
 const [programs, setPrograms] = useState<Program[]>([])
 const [loading, setLoading] = useState(true)
 const [search, setSearch] = useState("")
 const handleNew = useCallback(() => router.push("/knowledge/training/new"), [router])
 useHotkey("c", handleNew)

 useEffect(() => {
 fetch("/api/knowledge/training")
 .then((r) => r.json())
 .then((data) => { setPrograms(data); setLoading(false) })
 .catch(() => setLoading(false))
 }, [])

 const filtered = programs.filter(
 (p) => p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase())
 )

 return (
 <div className="animate-fade-in">
 <div className="page-header flex items-center justify-between">
 <div>
 <h1>Training Hub</h1>
 <p>Exercises, video tutorials, and learning paths</p>
 </div>
 <Button className="gap-1.5" onClick={handleNew}>
 <Plus className="w-4 h-4" /> New Program <ShortcutBadge shortcut="⌘C" />
 </Button>
 </div>

 <div className="relative mb-6">
 <Input
 placeholder="Search training programs..."
 className="pl-9 h-10"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 />
 </div>

 {loading ? (
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
 </div>
 ) : (
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {filtered.map((program) => (
 <Card key={program.id} className="card-hover card-shadow group cursor-pointer flex flex-col" onClick={() => router.push(`/knowledge/training/${program.id}`)}>
 <CardContent className="p-5 flex flex-col flex-1">
 <div className="flex items-start justify-between mb-3">
 <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center shrink-0">
 null
 </div>
 <Badge variant={program.level === "Beginner" ? "outline" : program.level === "Intermediate" ? "secondary" : "default"} className="text-[10px]">
 {program.level}
 </Badge>
 </div>

 <h3 className="font-medium text-sm mb-1 group-hover:text-primary transition-colors">{program.title}</h3>
 <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{program.description}</p>

 <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto mb-3 flex-wrap">
 <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">{program.type}</Badge>
 <span>{program.modules} modules</span>
 <span className="flex items-center gap-1">{program.duration}</span>
 </div>

 <div>
 <div className="flex items-center justify-between text-xs mb-1.5">
 <span className="text-muted-foreground">{program.students} enrolled</span>
 <span className={program.progress === 100 ? "text-success" : "text-muted-foreground"}>{program.progress}%</span>
 </div>
 <div className="h-1.5 bg-surface rounded-full overflow-hidden">
 <div
 className={`h-full rounded-full transition-all ${
 program.progress === 100 ? "bg-success" : "bg-primary"
 }`}
 style={{ width: `${program.progress}%` }}
 />
 </div>
 </div>
 </CardContent>
 </Card>
 ))}
 {filtered.length === 0 && !loading && (
 <div className="col-span-full text-center py-12 text-muted-foreground">
 <p className="text-sm">No programs found</p>
 </div>
 )}
 </div>
 )}
 </div>
 )
}
