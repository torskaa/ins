import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
 ({ className, type, "aria-invalid": ariaInvalid, ...props }, ref) => {
 return (
 <input
 type={type}
 className={cn(
 "flex h-10 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground",
 "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
 "disabled:cursor-not-allowed disabled:opacity-50",
 "transition-all duration-150",
 ariaInvalid === "true" && "border-destructive focus:ring-destructive/30 focus:border-destructive",
 className
 )}
 ref={ref}
 aria-invalid={ariaInvalid}
 {...props}
 />
 )
 }
)
Input.displayName = "Input"

export { Input }
