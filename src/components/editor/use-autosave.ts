"use client"

import { useCallback, useRef, useState } from "react"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

export function useAutosave<T extends Record<string, unknown>>(
  saveFn: (data: T) => Promise<void>,
  delay = 2000,
) {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataRef = useRef<T | null>(null)

  const schedule = useCallback(
    (data: T) => {
      dataRef.current = data
      setStatus("saving")
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(async () => {
        try {
          if (dataRef.current) await saveFn(dataRef.current)
          setStatus("saved")
        } catch {
          setStatus("error")
        }
      }, delay)
    },
    [saveFn, delay],
  )

  const saveNow = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (!dataRef.current) return
    setStatus("saving")
    try {
      await saveFn(dataRef.current)
      setStatus("saved")
    } catch {
      setStatus("error")
    }
  }, [saveFn])

  return { status, schedule, saveNow }
}
