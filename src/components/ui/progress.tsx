"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
 value?: number
 indicatorClassName?: string
}

function Progress({ className, indicatorClassName, value, ...props }: ProgressProps) {
 return (
 <div
 className={cn("relative h-2 w-full overflow-hidden rounded-full bg-surface", className)}
 {...props}
 >
 <div
 className={cn("h-full w-full flex-1 bg-primary transition-all duration-300 rounded-full", indicatorClassName)}
 style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
 />
 </div>
 )
}

export { Progress }
