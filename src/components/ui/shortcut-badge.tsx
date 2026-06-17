import { cn } from "@/lib/utils"

interface ShortcutBadgeProps {
 shortcut: string
 className?: string
 variant?: "default" | "primary"
}

export function ShortcutBadge({ shortcut, className, variant = "default" }: ShortcutBadgeProps) {
 return (
 <kbd
 className={cn(
 "inline-flex items-center rounded px-1 font-[inherit] text-sm",
 variant === "primary"
 ? "bg-white/20 text-white/70"
 : "text-muted-foreground/50",
 className,
 )}
 >
 {shortcut}
 </kbd>
 )
}
