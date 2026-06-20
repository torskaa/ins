"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Upload, Database, ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertTriangle, FileSpreadsheet, Table2, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { SkeletonPageHeader, Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"

type EntityInfo = {
 key: string
 label: string
 fieldCount: number
 requiredFields: string[]
}

type FieldDef = {
 key: string
 label: string
 type: string
 required?: boolean
 hint?: string
}

type ImportResult = {
 success: number
 errors: { row: number; message: string }[]
}

export default function MigrationPage() {
 const router = useRouter()
 const fileInputRef = useRef<HTMLInputElement>(null)

 const [step, setStep] = useState(0)
 const [entities, setEntities] = useState<EntityInfo[]>([])
 const [selectedEntity, setSelectedEntity] = useState<string | null>(null)
 const [fields, setFields] = useState<FieldDef[]>([])
 const [file, setFile] = useState<File | null>(null)
 const [preview, setPreview] = useState<string[]>([])
 const [previewData, setPreviewData] = useState<Record<string, string>[]>([])
 const [mapping, setMapping] = useState<Record<string, string>>({})
 const [importing, setImporting] = useState(false)
 const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
 fetch("/api/migration")
 .then((r) => r.json())
 .then((json) => { if (json?.success) setEntities(json.data); else throw new Error(json?.error || "Failed to load") })
  .catch((err) => { setError(err.message); setLoading(false) })
  .finally(() => setLoading(false))
 }, [])

 async function selectEntity(key: string) {
 setSelectedEntity(key)
 setResult(null)
 setFile(null)
 setPreview([])
 setPreviewData([])
 setMapping({})
 setStep(1)
 const res = await fetch("/api/migration")
 const json = await res.json()
 if (!json.success) throw new Error(json.error)
 const all: EntityInfo[] = json.data
 const entity = all.find((e) => e.key === key)
 if (entity) {
 const detailsRes = await fetch(`/api/migration?entity=${key}`)
 try {
 const details = await detailsRes.json()
 if (details.fields) setFields(details.fields)
 } catch {
 const ENTITY_FIELDS: Record<string, any[]> = {
 products: [
 { key: "name", label: "Product Name", type: "string", required: true },
 { key: "sku", label: "SKU", type: "string", required: true },
 { key: "barcode", label: "Barcode", type: "string" },
 { key: "description", label: "Description", type: "text" },
 { key: "unitPrice", label: "Unit Price", type: "number" },
 { key: "costPrice", label: "Cost Price", type: "number" },
 { key: "stock", label: "Stock Quantity", type: "number" },
 { key: "minStock", label: "Min Stock", type: "number" },
 { key: "safetyStock", label: "Safety Stock", type: "number" },
 { key: "uom", label: "Unit of Measure", type: "string" },
 { key: "type", label: "Product Type", type: "select" },
 { key: "status", label: "Status", type: "select" },
 { key: "category", label: "Category Name", type: "string" },
 { key: "supplier", label: "Supplier Name", type: "string" },
 { key: "weight", label: "Weight", type: "number" },
 { key: "tags", label: "Tags", type: "string" },
 ],
 customers: [
 { key: "name", label: "Customer Name", type: "string", required: true },
 { key: "email", label: "Email", type: "string" },
 { key: "phone", label: "Phone", type: "string" },
 { key: "address", label: "Address", type: "text" },
 { key: "company", label: "Company", type: "string" },
 { key: "taxId", label: "Tax ID", type: "string" },
 { key: "creditLimit", label: "Credit Limit", type: "number" },
 ],
 suppliers: [
 { key: "name", label: "Supplier Name", type: "string", required: true },
 { key: "email", label: "Email", type: "string" },
 { key: "phone", label: "Phone", type: "string" },
 { key: "address", label: "Address", type: "text" },
 { key: "taxId", label: "Tax ID", type: "string" },
 { key: "contactPerson", label: "Contact Person", type: "string" },
 { key: "paymentTerms", label: "Payment Terms", type: "string" },
 { key: "currency", label: "Currency", type: "select" },
 ],
 categories: [
 { key: "name", label: "Category Name", type: "string", required: true },
 { key: "slug", label: "Slug", type: "string" },
 { key: "description", label: "Description", type: "text" },
 ]}
 setFields(ENTITY_FIELDS[key] || [])
 }
 }
 }

 function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
 const f = e.target.files?.[0]
 if (!f) return
 setFile(f)
 parsePreview(f)
 }

 async function parsePreview(f: File) {
 const reader = new FileReader()
 reader.onload = (e) => {
 const text = e.target?.result as string
 const ext = f.name.split(".").pop()?.toLowerCase()

 try {
 if (ext === "csv") {
 const lines = text.split("\n").filter(Boolean)
 const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""))
 setPreview(headers)

 const data = lines.slice(1, 6).map((line) => {
 const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""))
 const row: Record<string, string> = {}
 headers.forEach((h, i) => { row[h] = vals[i] || "" })
 return row
 })
 setPreviewData(data)

 const autoMap: Record<string, string> = {}
 fields.forEach((f) => {
 const match = headers.find((h) =>
 h.toLowerCase().replace(/[\s_-]/g, "") === f.key.toLowerCase().replace(/[\s_-]/g, "") ||
 h.toLowerCase().replace(/[\s_-]/g, "").includes(f.key.toLowerCase().replace(/[\s_-]/g, ""))
 )
 if (match) autoMap[f.key] = match
 })
 setMapping(autoMap)
 } else if (ext === "xlsx" || ext === "xls") {
 import("xlsx").then((XLSX) => {
 const wb = XLSX.read(text, { type: "string" })
 const ws = wb.Sheets[wb.SheetNames[0]]
 const data = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "", header: 1 }) as any[]
 if (data.length > 0) {
 const headers = data[0] as string[]
 setPreview(headers)
 const rows = data.slice(1, 6).map((row: any) => {
 const r: Record<string, string> = {}
 headers.forEach((h: string, i: number) => { r[h] = String(row[i] || "") })
 return r
 })
 setPreviewData(rows)
 }
 })
 }
 if (fields.length > 0 && preview.length > 0) setStep(2)
 } catch {
 toast.error("Failed to parse file")
 }
 }
 reader.readAsText(f)
 }

 function updateMapping(field: string, column: string) {
 setMapping((prev) => ({ ...prev, [field]: column }))
 }

 const handleImportKey = useCallback(() => { if (step === 2 && !importing) handleImport() }, [step, importing])
 useHotkey("u", handleImportKey)

 async function handleImport() {
 if (!file || !selectedEntity) return
 setImporting(true)
 try {
 const formData = new FormData()
 formData.append("file", file)
 formData.append("entity", selectedEntity)
 formData.append("mapping", JSON.stringify(mapping))

 const res = await fetch("/api/migration/import", {
 method: "POST",
 body: formData})
 const json = await res.json()
 if (!json.success) throw new Error(json.error || "Import failed")
 const data = json.data
 setResult(data)
 setStep(3)
 if (data.errors.length === 0) {
 toast.success(`Imported ${data.success} records successfully`)
 } else {
 toast.warning(`Imported ${data.success} records with ${data.errors.length} errors`)
 }
 } catch (err: any) {
 toast.error(err.message || "Import failed")
 } finally {
 setImporting(false)
 }
 }

 function downloadTemplate() {
 if (!fields.length) return
 const headers = fields.map((f) => f.label)
 const rows = [headers.join(",")]
 const sampleRow = fields.map((f) => {
 if (f.key === "name") return "Sample Name"
 if (f.key === "sku") return `SMP-${Date.now()}`
 if (f.type === "number") return "0"
 if (f.hint) return f.hint.split(",")[0]
 return ""
 })
 rows.push(sampleRow.join(","))
 const csv = rows.join("\n")
 const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
 const url = URL.createObjectURL(blob)
 const a = document.createElement("a")
 a.href = url
 a.download = `${selectedEntity}-template.csv`
 a.click()
 URL.revokeObjectURL(url)
 }

  if (error) {
    return (
      <div className="animate-fade-in pb-8 space-y-4">
        <EmptyState variant="error" title="Failed to load data" description={error} icons={[<AlertTriangle key="e" className="w-6 h-6" />]} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
      </div>
    )
  }

  if (loading) {
    return <div className="animate-fade-in space-y-6 p-6"><SkeletonPageHeader /><Skeleton className="h-64 rounded-xl" /></div>
  }

 const mappedCount = Object.values(mapping).filter(Boolean).length
 const requiredFields = fields.filter((f) => f.required)
 const allRequiredMapped = requiredFields.every((f) => mapping[f.key])

 return (
 <div className="animate-fade-in max-w-4xl mx-auto">
 <div className="page-header">
 <h1>Data Migration</h1>
 <p>Import data from CSV or Excel files</p>
 </div>

 {/* Step Indicator */}
 <div className="flex items-center gap-0 mb-8">
 {[
 { label: "Select Type", icon: Database },
 { label: "Upload & Map", icon: Table2 },
 { label: "Import", icon: Upload },
 { label: "Results", icon: CheckCircle2 },
 ].map((s, i) => (
 <div key={s.label} className="flex items-center flex-1">
 <div className={cn(
 "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
 step === i ? "bg-primary text-primary-foreground" : step > i ? "bg-success/10 text-success" : "bg-surface text-muted-foreground"
 )}>
 <s.icon className="w-4 h-4" />
 <span className="hidden sm:inline">{s.label}</span>
 </div>
 {i < 3 && null}
 </div>
 ))}
 </div>

 {/* Step 0: Select Entity */}
 {step === 0 && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {entities.map((e) => (
 <Card key={e.key} className="cursor-pointer hover:border-primary transition-all" onClick={() => selectEntity(e.key)}>
 <CardContent className="p-5">
 <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center mb-3">
 <Database className="w-5 h-5 text-primary" />
 </div>
 <h3 className="font-semibold mb-1">{e.label}</h3>
 <p className="text-xs text-muted-foreground">{e.fieldCount} fields ({e.requiredFields.length} required)</p>
 </CardContent>
 </Card>
 ))}
 </div>
 )}

 {/* Step 1-2: Upload & Map Columns */}
 {step === 1 && (
 <div className="space-y-6">
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 Upload File
 </CardTitle>
 <CardDescription>CSV or Excel file with headers in the first row</CardDescription>
 </CardHeader>
 <CardContent>
 <div
 onClick={() => fileInputRef.current?.click()}
 className={cn(
 "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all",
 "hover:border-primary hover:bg-primary/5",
 file && "border-success bg-success/5"
 )}
 >
 {file ? (
 <div>
 <FileSpreadsheet className="w-10 h-10 text-success mx-auto mb-2" />
 <p className="font-medium">{file.name}</p>
 <p className="text-xs text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
 </div>
 ) : (
 <div>
 <p className="font-medium">Choose a CSV or Excel file</p>
 <p className="text-xs text-muted-foreground mt-1">First row must contain column headers</p>
 </div>
 )}
 <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".csv,.xlsx,.xls" />
 </div>
 {fields.length > 0 && (
 <Button variant="ghost" size="sm" className="mt-3 gap-1.5" onClick={downloadTemplate}>
 Download Template
 </Button>
 )}
 </CardContent>
 </Card>
 </div>
 )}

 {/* Step 2: Column Mapping */}
 {step === 2 && preview.length > 0 && (
 <div className="space-y-6">
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between">
 <div>
 <CardTitle className="flex items-center gap-2">
 Column Mapping
 </CardTitle>
 <CardDescription>Map your file columns to system fields</CardDescription>
 </div>
 <Badge variant={allRequiredMapped ? "primary" : "secondary"}>
 {mappedCount}/{fields.length} mapped
 </Badge>
 </div>
 </CardHeader>
 <CardContent>
 <div className="space-y-3">
 {fields.map((f) => (
 <div key={f.key} className="flex items-center gap-3">
 <div className="w-40 shrink-0">
 <span className="text-sm font-medium">{f.label}</span>
 {f.required && <span className="text-destructive ml-1">*</span>}
 {f.hint && <p className="text-[10px] text-muted-foreground">{f.hint}</p>}
 </div>
 <select
 className={cn(
 "flex-1 h-9 rounded-lg border border-border bg-background px-3 text-sm",
 mapping[f.key] ? "text-foreground" : "text-muted-foreground"
 )}
 value={mapping[f.key] || ""}
 onChange={(e) => updateMapping(f.key, e.target.value)}
 >
 <option value="">— Skip —</option>
 {preview.map((h) => (
 <option key={h} value={h}>{h}</option>
 ))}
 </select>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>

 {/* Preview */}
 {previewData.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-sm">
 <Table2 className="w-4 h-4 text-primary" /> Preview (first {previewData.length} rows)
 </CardTitle>
 </CardHeader>
 <CardContent className="overflow-x-auto">
 <table className="w-full text-xs">
 <thead>
 <tr className="border-b border-border">
 {preview.map((h) => (
 <th key={h} className="text-left p-2 font-medium text-muted-foreground">{h}</th>
 ))}
 </tr>
 </thead>
 <tbody>
 {previewData.map((row, i) => (
 <tr key={i} className="border-b border-border/50">
 {preview.map((h) => (
 <td key={h} className="p-2">{row[h] || ""}</td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </CardContent>
 </Card>
 )}

 <div className="flex items-center justify-between pt-4 border-t border-border">
 <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
 <Button
 onClick={handleImport}
 disabled={!allRequiredMapped || importing}
 loading={importing}
 className="gap-1.5"
 >
 Import {previewData.length}+ Records <ShortcutBadge shortcut="⌘U" />
 </Button>
 </div>
 </div>
 )}

 {/* Step 3: Results */}
 {step === 3 && result && (
 <div className="space-y-6">
 <Card>
 <CardContent className="p-8 text-center">
 {result.errors.length === 0 ? (
 <div>
 <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
 </div>
 <h2 className="text-xl font-semibold mb-1">Import Complete</h2>
 <p className="text-muted-foreground mb-4">
 Successfully imported <strong>{result.success}</strong> records with no errors
 </p>
 </div>
 ) : (
 <div>
 <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-4">
 <AlertTriangle className="w-8 h-8 text-warning" />
 </div>
 <h2 className="text-xl font-semibold mb-1">Import Completed with Warnings</h2>
 <p className="text-muted-foreground mb-4">
 <strong>{result.success}</strong> imported, <strong>{result.errors.length}</strong> errors
 </p>
 </div>
 )}
 <Progress value={result.errors.length === 0 ? 100 : (result.success / (result.success + result.errors.length)) * 100} className="max-w-xs mx-auto mb-6" />
 <div className="flex items-center justify-center gap-4">
 <Badge variant="primary" className="text-sm px-3 py-1.5">
 {result.success} success
 </Badge>
 {result.errors.length > 0 && (
 <Badge variant="destructive" className="text-sm px-3 py-1.5">
 {result.errors.length} errors
 </Badge>
 )}
 </div>
 </CardContent>
 </Card>

 {result.errors.length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle className="text-sm flex items-center gap-2">
 <AlertTriangle className="w-4 h-4 text-warning" /> Error Details
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-1 max-h-60 overflow-y-auto">
 {result.errors.map((err, i) => (
 <div key={i} className="text-xs p-2 rounded bg-destructive/5 text-destructive">
 Row {err.row}: {err.message}
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 )}

 <div className="flex items-center justify-between pt-4 border-t border-border">
 <Button variant="ghost" onClick={() => { setStep(0); setSelectedEntity(null); setResult(null) }}>
 Import Another File
 </Button>
 <Button onClick={() => router.push(`/${selectedEntity === "products" ? "inventory" : selectedEntity === "customers" ? "crm" : selectedEntity === "suppliers" ? "suppliers" : "categories"}`)}>
 View {entities.find((e) => e.key === selectedEntity)?.label}
 </Button>
 </div>
 </div>
 )}
 </div>
 )
}
