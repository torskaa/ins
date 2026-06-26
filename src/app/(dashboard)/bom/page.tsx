"use client"

import { useState, useEffect, useCallback } from "react"
import { Badge, SemanticBadge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"
import { useHotkey } from "@/hooks/use-hotkey"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { UploadFileMain } from "@/components/upload/upload-file-main"
import { useUploadImport } from "@/hooks/use-upload-import"
import { toast } from "sonner"
import { MoreMenu, ActionIcons } from "@/components/ui/more-menu"
import { useRouter } from "next/navigation"
import { downloadCSV, downloadPDF } from "@/lib/export"
import { SkeletonTable } from "@/components/ui/skeleton"
import { PlaceholderImage } from "@/components/ui/placeholder-image"
import { Layers, Package, Archive, AlertTriangle } from "lucide-react"

type BOMItem = {
  id: string
  finishedGood: { id: string; name: string; sku: string; image?: string }
  material: { id: string; name: string; sku: string; type: string }
  quantity: number
  scrapAllowance: number
  unit: string
  wastePercent: number
  version: number
  status: string
  effectiveDate: string | null
  createdAt: string
}

type VersionGroup = {
  version: number
  status: string
  items: BOMItem[]
}

type BOMGroup = {
  finishedGoodId: string
  finishedGoodName: string
  finishedGoodSku: string
  finishedGoodImage?: string
  versions: VersionGroup[]
}

function groupBOMs(boms: BOMItem[]): BOMGroup[] {
  const fgMap = new Map<string, BOMGroup>()
  for (const b of boms) {
    const fgKey = b.finishedGood.id
    if (!fgMap.has(fgKey)) {
      fgMap.set(fgKey, {
        finishedGoodId: fgKey,
        finishedGoodName: b.finishedGood.name,
        finishedGoodSku: b.finishedGood.sku,
        finishedGoodImage: b.finishedGood.image,
        versions: [],
      })
    }
    const group = fgMap.get(fgKey)!
    let vg = group.versions.find((v) => v.version === b.version)
    if (!vg) {
      vg = { version: b.version, status: b.status, items: [] }
      group.versions.push(vg)
    }
    vg.items.push(b)
  }
  for (const group of fgMap.values()) {
    group.versions.sort((a, b) => b.version - a.version)
  }
  return Array.from(fgMap.values()).sort((a, b) => a.finishedGoodName.localeCompare(b.finishedGoodName))
}

export default function BOMPage() {
  const [boms, setBoms] = useState<BOMItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()
  const handleNew = useCallback(() => router.push("/bom/new"), [router])
  useHotkey("c", handleNew)
  const [uploadOpen, setUploadOpen] = useState(false)
  const { files, addFiles, removeFile } = useUploadImport("bom")
  useHotkey("u", () => setUploadOpen(true))

  useEffect(() => {
    fetch("/api/bom")
      .then((res) => res.json())
      .then((json) => {
        const list = json?.success && Array.isArray(json.data) ? json.data : []
        setBoms(list)
        if (!json?.success) throw new Error(json?.error || "Failed to load")
      })
      .catch((err) => { setError(err.message || "Failed to load data"); setLoading(false) })
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/bom/${deleteId}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete")
      }
      setBoms((prev) => prev.filter((b) => b.id !== deleteId))
      toast.success("BOM entry deleted")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
      setDeleteId(null)
    }
  }

  const groups = groupBOMs(boms)
  const totalMaterials = boms.length
  const totalGroups = groups.length
  const latest = groups.filter((g) => g.versions[0]?.status === "approved")
  const draft = groups.filter((g) => g.versions[0]?.status === "draft")

  if (error) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bill of Materials</h1>
            <p className="text-sm text-foreground mt-1">Manufacturing engine — define, version, and approve production recipes</p>
          </div>
        </div>
        <EmptyState variant="error" title="Failed to load data" description={error} actions={[{ label: "Try again", onClick: () => window.location.reload() }]} />
      </div>
    )
  }

  if (!loading && boms.length === 0) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Bill of Materials</h1>
            <p className="text-sm text-foreground mt-1">Manufacturing engine — define, version, and approve production recipes</p>
          </div>
          <MoreMenu actions={[
            { label: "Import", icon: ActionIcons.AddNew },
            "separator",
            { label: "Export CSV", icon: ActionIcons.ExportCSV },
            { label: "Export PDF", icon: ActionIcons.ExportPDF },
          ]} />
        </div>
        <EmptyState icons={[<Layers className="w-5 h-5" />, <Package className="w-5 h-5" />, <Archive className="w-5 h-5" />]} title="No BOMs yet" description="Create your first bill of materials to link finished goods with raw materials" actions={[{ label: "New BOM", onClick: () => router.push("/bom/new") }]} />
      </div>
    )
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bill of Materials</h1>
          <p className="text-sm text-foreground mt-1">
            {totalGroups} finished goods · {totalMaterials} material links ·
            <span className="text-success ml-1">{latest.length} approved</span>
            <span className="text-warning ml-1"> · {draft.length} draft</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => setUploadOpen(true)}>
            Upload file <kbd className="text-[9px] px-1 py-0.5 rounded bg-muted/20 text-primary-foreground font-mono ml-0.5">⌘U</kbd>
          </Button>
          <Button size="sm" onClick={handleNew} className="h-9 gap-1.5">
            New BOM <kbd className="text-[9px] px-1 py-0.5 rounded bg-primary-foreground/20 text-primary-foreground/70 font-mono ml-0.5">⌘C</kbd>
          </Button>
        </div>
      </div>

      {loading ? (
        <SkeletonTable rows={5} columns={6} />
      ) : (
        <div data-slot="frame">
          <Table className="[&_th]:px-4 [&_td]:px-4 [&_th]:py-3 [&_td]:py-3">
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Versions</TableHead>
                <TableHead>Latest</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Components</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groups.map((group) => {
                const latestV = group.versions[0]
                return (
                  <TableRow
                    key={group.finishedGoodId}
                    className="cursor-pointer"
                    onClick={() => router.push(`/bom/${group.finishedGoodId}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {group.finishedGoodImage ? (
                          <img src={group.finishedGoodImage} alt={group.finishedGoodName} className="w-10 h-10 rounded-md object-cover border border-border/60 shrink-0" />
                        ) : (
                          <PlaceholderImage name={group.finishedGoodName} className="w-10 h-10 text-xs shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium truncate">{group.finishedGoodName}</p>
                          <p className="text-xs text-foreground font-mono truncate">{group.finishedGoodSku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{group.versions.length}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">v{latestV?.version}</span>
                    </TableCell>
                    <TableCell>
                      {latestV && (
                        <SemanticBadge semantic={latestV.status} category="status">
                          {latestV.status}
                        </SemanticBadge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{latestV?.items.length || 0}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive h-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (latestV?.items[0]) setDeleteId(latestV.items[0].id)
                        }}
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null) }}
        title="Delete BOM Entry"
        description="Are you sure you want to delete this material from the BOM? This action cannot be undone."
        onConfirm={handleDelete}
        loading={deleting}
      />
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent hideCloseButton className="sm:max-w-lg p-0 gap-0 overflow-hidden">
          <UploadFileMain
            files={files}
            onFilesChange={addFiles}
            onFileRemove={removeFile}
            onClose={() => setUploadOpen(false)}
            moduleLabel="bom files"
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
