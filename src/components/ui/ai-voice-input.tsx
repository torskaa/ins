"use client"

import { useState, useRef, useEffect } from "react"

interface AIVoiceInputProps {
  onStart?: () => void
  onStop?: (duration: number) => void
}

function AIVoiceInput({ onStart, onStop }: AIVoiceInputProps) {
  const [recording, setRecording] = useState(false)
  const startTimeRef = useRef<number>(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!recording) return
    const interval = setInterval(() => setElapsed(Date.now() - startTimeRef.current), 100)
    return () => clearInterval(interval)
  }, [recording])

  function toggle() {
    if (recording) {
      const duration = Date.now() - startTimeRef.current
      setRecording(false)
      onStop?.(duration)
    } else {
      startTimeRef.current = Date.now()
      setElapsed(0)
      setRecording(true)
      onStart?.()
    }
  }

  function format(ms: number) {
    const s = Math.floor(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
  }

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border/30 bg-background hover:bg-surface transition-colors"
    >
      <div className="flex items-center gap-0.5 h-5">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="w-0.5 rounded-full bg-foreground/60"
            style={{
              height: recording ? `${8 + (i * 17) % 13}px` : "5px",
              transition: "height 0.1s ease",
              animation: recording ? "none" : undefined,
            }}
          />
        ))}
      </div>
      {recording && <span className="text-xs font-medium text-foreground/50 tabular-nums">{format(elapsed)}</span>}
    </button>
  )
}

export { AIVoiceInput }
