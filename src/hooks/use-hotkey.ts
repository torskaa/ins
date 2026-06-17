"use client"

import { useEffect } from "react"

export function useHotkey(key: string, callback: () => void, options?: { enabled?: boolean }) {
  useEffect(() => {
    if (options?.enabled === false) return
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault()
        callback()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [key, callback, options?.enabled])
}
