"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
}

export function ButtonColorful({ className, children, ...props }: ButtonColorfulProps) {
  return (
    <button
      className={cn(
        "relative inline-flex h-9 items-center justify-center gap-1.5 rounded-[min(var(--radius-md),12px)] px-3 text-xs font-medium transition-all duration-200",
        "bg-gradient-to-r from-violet-600 via-purple-500 to-fuchsia-500 text-white",
        "hover:from-violet-500 hover:via-purple-400 hover:to-fuchsia-400 hover:shadow-lg hover:shadow-purple-500/25",
        "active:scale-[0.97]",
        "shadow-md shadow-purple-500/20",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
