"use client"

import { useEffect } from "react"

export function useUnsavedChanges(unsaved: boolean) {
  useEffect(() => {
    if (!unsaved) return

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener("beforeunload", handler)

    return () => window.removeEventListener("beforeunload", handler)
  }, [unsaved])
}
