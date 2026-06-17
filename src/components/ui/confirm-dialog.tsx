"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogDescription,
} from "@/components/ui/dialog"

export function ConfirmDialog({
 open,
 onOpenChange,
 title,
 description,
 onConfirm,
 loading,
}: {
 open: boolean
 onOpenChange: (open: boolean) => void
 title: string
 description: string
 onConfirm: () => void
 loading?: boolean
}) {
 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="sm:max-w-md !p-0 !rounded-2xl gap-0 overflow-hidden">
 <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/40">
 <DialogTitle>{title}</DialogTitle>
 <DialogDescription>{description}</DialogDescription>
 </DialogHeader>
 <div className="flex items-center justify-end gap-3 px-6 py-4">
 <Button variant="outline" onClick={() => onOpenChange(false)}>
 Cancel
 </Button>
 <Button variant="destructive" onClick={onConfirm} loading={loading}>Delete</Button>
 </div>
 </DialogContent>
 </Dialog>
 )
}
