"use client"

import { forwardRef } from "react"

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
 ({ children, className, ...props }, ref) => (
 <div
 ref={ref}
 className={`overflow-y-auto scrollbar-thin scrollbar-thumb-foreground/10 scrollbar-track-transparent ${className || ""}`}
 {...props}
 >
 {children}
 </div>
 )
)
ScrollArea.displayName = "ScrollArea"
