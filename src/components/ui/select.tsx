import * as React from "react"
import { cn } from "@/lib/utils"

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
 options?: { value: string; label: string }[]
 placeholder?: string
 onValueChange?: (value: string) => void
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
 ({ className, options, placeholder, children, "aria-invalid": ariaInvalid, onValueChange, onChange, ...props }, ref) => {
 return (
 <div className="relative">
 <select
 ref={ref}
 className={cn(
 "flex h-10 w-full appearance-none rounded-lg border border-border bg-card px-3 py-2 pr-8 text-sm text-foreground",
 "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50",
 "disabled:cursor-not-allowed disabled:opacity-50",
 "transition-all duration-150",
 ariaInvalid === "true" && "border-destructive focus:ring-destructive/30 focus:border-destructive",
 className
 )}
 aria-invalid={ariaInvalid}
 onChange={(e) => {
 onChange?.(e)
 onValueChange?.(e.target.value)
 }}
 {...props}
 >
 {placeholder && <option value="">{placeholder}</option>}
 {options?.map((opt) => (
 <option key={opt.value} value={opt.value}>{opt.label}</option>
 ))}
 {children}
 </select>
 </div>
 )
 }
)
Select.displayName = "Select"

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
 ({ className, children, ...props }, ref) => (
 <button ref={ref} className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-border bg-card px-3 py-2 text-sm", className)} {...props}>
 {children}
 </button>
 )
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = ({ placeholder, children }: { placeholder?: string; children?: React.ReactNode }) => (
 <span className="text-muted-foreground">{children || placeholder || "Select..."}</span>
)

const SelectContent = ({ children, className }: { children?: React.ReactNode; className?: string }) => (
 <div className={cn("absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-dropdown", className)}>
 {children}
 </div>
)

const SelectItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { value: string }>(
 ({ className, children, ...props }, ref) => (
 <div ref={ref} className={cn("flex cursor-pointer items-center px-3 py-2 text-sm hover:bg-surface transition-colors", className)} {...props}>
 {children}
 </div>
 )
)
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
