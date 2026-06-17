"use client"

import { memo, useId, forwardRef, type ReactNode } from "react"
import { motion, LazyMotion, domAnimation } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ShortcutBadge } from "@/components/ui/shortcut-badge"

const ICON_VARIANTS = {
 left: {
 initial: { scale: 0.8, opacity: 0, x: 0, y: 0, rotate: 0 },
 animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: -6, transition: { duration: 0.4, delay: 0.1 } },
 hover: { x: -22, y: -5, rotate: -15, scale: 1.1, transition: { duration: 0.2 } },
 },
 center: {
 initial: { scale: 0.8, opacity: 0 },
 animate: { scale: 1, opacity: 1, transition: { duration: 0.4, delay: 0.2 } },
 hover: { y: -10, scale: 1.15, transition: { duration: 0.2 } },
 },
 right: {
 initial: { scale: 0.8, opacity: 0, x: 0, y: 0, rotate: 0 },
 animate: { scale: 1, opacity: 1, x: 0, y: 0, rotate: 6, transition: { duration: 0.4, delay: 0.3 } },
 hover: { x: 22, y: -5, rotate: 15, scale: 1.1, transition: { duration: 0.2 } },
 },
}

const CONTENT_VARIANTS = {
 initial: { y: 20, opacity: 0 },
 animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.2 } },
}

const BUTTON_VARIANTS = {
 initial: { y: 20, opacity: 0 },
 animate: { y: 0, opacity: 1, transition: { duration: 0.4, delay: 0.3 } },
}

const IconContainer = memo(({ children, variant, className }: { children: ReactNode; variant: "left" | "center" | "right"; className?: string }) => (
 <motion.div
 variants={ICON_VARIANTS[variant]}
 className={cn(
 "w-12 h-12 rounded-xl flex items-center justify-center relative shadow-lg transition-all duration-300",
 "bg-card border border-border group-hover:shadow-xl group-hover:border-border/80",
 className
 )}
 >
 <div className="text-base transition-colors duration-300 text-muted-foreground group-hover:text-foreground">
 {children}
 </div>
 </motion.div>
))
IconContainer.displayName = "IconContainer"

const MultiIconDisplay = memo(({ icons }: { icons: [ReactNode, ReactNode, ReactNode] }) => (
 <div className="flex justify-center isolate relative">
 <IconContainer variant="left" className="left-2 top-1 z-10">
 {icons[0]}
 </IconContainer>
 <IconContainer variant="center" className="z-20">
 {icons[1]}
 </IconContainer>
 <IconContainer variant="right" className="right-2 top-1 z-10">
 {icons[2]}
 </IconContainer>
 </div>
))
MultiIconDisplay.displayName = "MultiIconDisplay"

const Background = () => (
 <div
 aria-hidden="true"
 className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500"
 style={{
 backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 1px)`,
 backgroundSize: "24px 24px",
 }}
 />
)

export const EmptyState = forwardRef<
 HTMLElement,
 {
 title: string
 description?: string
 icons?: ReactNode | ReactNode[]
 actions?: {
 label: string
 onClick: () => void
 icon?: ReactNode
 variant?: "default" | "outline" | "ghost" | "gradient" | "secondary"
 shortcut?: string
 }[]
 variant?: "default" | "subtle" | "error"
 size?: "sm" | "default" | "lg"
 className?: string
 }
>(({ title, description, icons, actions, variant = "default", size = "default", className = "" }, ref) => {
 const titleId = useId()
 const descriptionId = useId()

 const sizeClasses = { sm: "p-6", default: "p-8", lg: "p-12" }

 const variantClasses = {
 default: "bg-card border border-border/60 hover:border-border hover:bg-surface/50",
 subtle: "bg-card border border-transparent hover:bg-surface/30",
 error: "bg-card border border-red-200 bg-red-50/50 hover:bg-red-50/80",
 }

 const sizeTitle = { sm: "text-base", default: "text-lg", lg: "text-xl" }
 const sizeDesc = { sm: "text-xs", default: "text-sm", lg: "text-base" }

 return (
 <LazyMotion features={domAnimation}>
 <motion.section
 ref={ref}
 role="region"
 aria-labelledby={titleId}
 aria-describedby={description ? descriptionId : undefined}
 className={cn(
 "group transition-all duration-300 rounded-xl relative overflow-hidden text-center flex flex-col items-center justify-center",
 sizeClasses[size],
 variantClasses[variant],
 className
 )}
 initial="initial"
 animate="animate"
 whileHover={icons ? "hover" : "animate"}
 >
 <Background />
 <div className="relative z-10 flex flex-col items-center">
 {icons && Array.isArray(icons) && icons.length === 3 ? (
 <div className="mb-6">
 <MultiIconDisplay icons={icons as [ReactNode, ReactNode, ReactNode]} />
 </div>
 ) : icons ? (
 <div className="mb-6">
 <IconContainer variant="center">{icons}</IconContainer>
 </div>
 ) : null}

 <motion.div variants={CONTENT_VARIANTS} className="space-y-2">
 <h2 id={titleId} className={cn("font-semibold transition-colors duration-200 text-foreground", sizeTitle[size])}>
 {title}
 </h2>
 {description && (
 <p id={descriptionId} className={cn("text-muted-foreground max-w-md leading-relaxed", sizeDesc[size])}>
 {description}
 </p>
 )}
 </motion.div>

 {actions && actions.length > 0 && (
 <motion.div variants={BUTTON_VARIANTS} className="mt-6 flex items-center gap-3">
 {actions.map((action, i) => (
 <Button key={i} variant={action.variant || "default"} size="sm" onClick={action.onClick}>
 {action.icon && <span className="mr-1.5">{action.icon}</span>}
 {action.label}
 {action.shortcut && <ShortcutBadge shortcut={action.shortcut} className="ml-1.5" />}
 </Button>
 ))}
 </motion.div>
 )}
 </div>
 </motion.section>
 </LazyMotion>
 )
})
EmptyState.displayName = "EmptyState"
