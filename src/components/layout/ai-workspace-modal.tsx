"use client"

import { useEffect } from "react"
import AiWorkspace from "@/components/layout/ai-workspace"

export function AiWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#fcfcfc]">
      <AiWorkspace onClose={onClose} />
    </div>
  )
}
