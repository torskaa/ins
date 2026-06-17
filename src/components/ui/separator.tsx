"use client"

import { forwardRef } from "react"

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
 orientation?: "horizontal" | "vertical"
}

export const Separator = forwardRef<HTMLDivElement, SeparatorProps>(
 ({ className, orientation = "horizontal", ...props }, ref) => (
 <div
 ref={ref}
 className={`shrink-0 bg-border/50 ${
 orientation === "horizontal" ? "h-px w-full" : "h-full w-px"
 } ${className || ""}`}
 {...props}
 />
 )
)
Separator.displayName = "Separator"
