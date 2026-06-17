import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
 "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 select-none",
 {
 variants: {
 variant: {
 default:
 "bg-primary text-white hover:bg-primary-dark active:scale-[0.97]",
 secondary:
 "bg-card border border-border text-foreground hover:bg-card-hover hover:border-border-light",
 outline:
 "border border-border bg-transparent text-foreground hover:bg-card",
 ghost:
 "text-muted-foreground hover:text-foreground hover:bg-card",
 link:
 "text-primary underline-offset-4 hover:underline h-auto px-0",
 destructive:
 "bg-destructive text-white hover:bg-red-600 active:scale-[0.97]",
 success:
 "bg-success text-white hover:bg-green-600 active:scale-[0.97]",
 gradient:
 "bg-gradient-to-r from-primary to-primary-dark text-white active:scale-[0.97]",
 },
 size: {
 default: "h-10 px-4 py-2",
 sm: "h-9 rounded-md px-3 text-xs",
 lg: "h-12 rounded-lg px-8 text-base",
 xl: "h-14 rounded-xl px-10 text-lg",
 icon: "h-10 w-10 rounded-lg",
 iconSm: "h-8 w-8 rounded-md",
 },
 },
 defaultVariants: {
 variant: "default",
 size: "default",
 },
 }
)

export interface ButtonProps
 extends React.ButtonHTMLAttributes<HTMLButtonElement>,
 VariantProps<typeof buttonVariants> {
 asChild?: boolean
 loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
 const Comp = asChild ? Slot : "button"
 return (
 <Comp
 className={cn(buttonVariants({ variant, size, className }))}
 ref={ref}
 disabled={disabled || loading}
 aria-busy={loading || undefined}
 {...props}
 >
 {loading ? (
 <>
 <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
 </svg>
 {children}
 </>
 ) : (
 children
 )}
 </Comp>
 )
 }
)
Button.displayName = "Button"

export { Button, buttonVariants }
