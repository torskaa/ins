import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
 "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors",
 {
 variants: {
 variant: {
 default: "bg-primary/10 text-primary-dark",
 secondary: "bg-secondary/15 text-secondary-dark",
 success: "bg-success/15 text-success",
 destructive: "bg-destructive/15 text-destructive",
 outline: "border border-border text-muted-foreground",
 accent: "bg-accent/15 text-amber-700",
 warning: "bg-warning/15 text-amber-700",
 },
 },
 defaultVariants: {
 variant: "default",
 },
 }
)

interface BadgeProps
 extends React.HTMLAttributes<HTMLDivElement>,
 VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
 return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
