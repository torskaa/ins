"use client"

import { Sparkles, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export type AiLoaderVariant = "shimmer-text" | "dots" | "loading-line" | "spinner" | "pulse-ring"

export interface AiLoaderProps {
  variant?: AiLoaderVariant
  text?: string
  className?: string
}

export function AiLoader({ variant = "shimmer-text", text = "Processing...", className = "" }: AiLoaderProps) {
  if (variant === "shimmer-text") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <span className="bg-gradient-to-r from-muted-foreground via-foreground to-muted-foreground bg-[length:200%_auto] animate-[shimmer-loader_3s_linear_infinite] bg-clip-text text-transparent font-medium tracking-wide">
          {text}
        </span>
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={`flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 backdrop-blur-md shadow-xs w-fit ${className}`}>
        <div className="w-2 h-2 rounded-full bg-primary animate-[ai-dots-think_1.4s_ease-in-out_infinite]" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-[ai-dots-think_1.4s_ease-in-out_infinite]" style={{ animationDelay: "160ms" }} />
        <div className="w-2 h-2 rounded-full bg-primary animate-[ai-dots-think_1.4s_ease-in-out_infinite]" style={{ animationDelay: "320ms" }} />
      </div>
    )
  }

  if (variant === "loading-line") {
    return (
      <div className={`w-full h-[3px] bg-black/5 dark:bg-white/10 rounded-full overflow-hidden relative backdrop-blur-sm shadow-inner ${className}`}>
        <div className="absolute top-0 bottom-0 -left-full w-full animate-[ai-loading-line-sweep_2s_cubic-bezier(0.4,0,0.2,1)_infinite]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-12 bg-black/40 dark:bg-white/90 blur-[1px] rounded-full" />
        </div>
      </div>
    )
  }

  if (variant === "spinner") {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    )
  }

  if (variant === "pulse-ring") {
    return (
      <div className={`relative flex items-center justify-center w-8 h-8 ${className}`}>
        <div className="absolute inset-0 rounded-full border-[3px] border-black/5 dark:border-white/10" />
        <svg
          className="w-full h-full animate-[spin_2s_linear_infinite]"
          viewBox="0 0 50 50"
        >
          <circle
            className="stroke-primary fill-none stroke-[4] animate-[ai-loading-ring_1.5s_ease-in-out_infinite] drop-shadow-sm dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"
            strokeLinecap="round"
            cx="25"
            cy="25"
            r="20"
          />
        </svg>
      </div>
    )
  }

  return null
}

export interface RevealAnimationProps {
  children: React.ReactNode
  delay?: number
  className?: string
}

export function RevealAnimation({ children, delay = 0, className = "" }: RevealAnimationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"} ${className}`}
    >
      {children}
    </div>
  )
}
