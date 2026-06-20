"use client"

import { useState } from "react"
import { MoreHorizontal, RefreshCw, FileText, FileSpreadsheet, Share2, Layout, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuGroup,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
 SyncToolModal,
 ExportPDFModal,
 ExportCSVModal,
 ShareModal,
 LayoutSettingsModal,
 WidgetPreferencesModal,
} from "./action-modals"

type ModalKey = "sync" | "pdf" | "csv-export" | "share" | "layout" | "preferences" | null

export function RichMenu() {
 const [modal, setModal] = useState<ModalKey>(null)

 return (
 <>
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
  <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-muted-foreground">
  <MoreHorizontal className="w-4 h-4" /> More
  </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent className="w-56" align="end">
  <DropdownMenuItem onClick={() => setModal("sync")} className="text-xs gap-2.5">
  <RefreshCw className="w-4 h-4 text-muted-foreground" />
  <span>Sync Tool</span>
  </DropdownMenuItem>

 <DropdownMenuSeparator />

 <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
 Export / Share
 </DropdownMenuLabel>
 <DropdownMenuGroup>
  <DropdownMenuItem onClick={() => setModal("pdf")} className="text-xs gap-2.5">
  <FileText className="w-4 h-4 text-muted-foreground" />
  <span>Export as PDF</span>
  </DropdownMenuItem>
 <DropdownMenuItem onClick={() => setModal("csv-export")} className="text-xs gap-2.5">
 <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
 <span>Export as CSV</span>
 </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setModal("share")} className="text-xs gap-2.5">
  <Share2 className="w-4 h-4 text-muted-foreground" />
  <span>Share Dashboard</span>
  </DropdownMenuItem>
 </DropdownMenuGroup>

 <DropdownMenuSeparator />

 <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
 Settings
 </DropdownMenuLabel>
 <DropdownMenuGroup>
  <DropdownMenuItem onClick={() => setModal("layout")} className="text-xs gap-2.5">
  <Layout className="w-4 h-4 text-muted-foreground" />
  <span>Layout Settings</span>
  </DropdownMenuItem>
  <DropdownMenuItem onClick={() => setModal("preferences")} className="text-xs gap-2.5">
  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
  <span>Widget Preferences</span>
  </DropdownMenuItem>
 </DropdownMenuGroup>
 </DropdownMenuContent>
 </DropdownMenu>

 <SyncToolModal open={modal === "sync"} onOpenChange={(o) => setModal(o ? "sync" : null)} />
 <ExportPDFModal open={modal === "pdf"} onOpenChange={(o) => setModal(o ? "pdf" : null)} />
 <ExportCSVModal open={modal === "csv-export"} onOpenChange={(o) => setModal(o ? "csv-export" : null)} />
 <ShareModal open={modal === "share"} onOpenChange={(o) => setModal(o ? "share" : null)} />
 <LayoutSettingsModal open={modal === "layout"} onOpenChange={(o) => setModal(o ? "layout" : null)} />
 <WidgetPreferencesModal open={modal === "preferences"} onOpenChange={(o) => setModal(o ? "preferences" : null)} />
 </>
 )
}
