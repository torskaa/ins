"use client"

import { analyzePassword } from "@/lib/validation"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
 password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
 const { score, label, color, checks } = analyzePassword(password)

 if (!password) return null

 return (
 <div className="space-y-3 animate-fade-in">
 <div className="flex items-center gap-2">
 <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
 <div
 className={cn("h-full rounded-full transition-all duration-300", color)}
 style={{ width: `${(score / 4) * 100}%` }}
 />
 </div>
 {label && (
 <span className={cn("text-xs font-medium tabular-nums", color.replace("bg-", "text-"))}>
 {label}
 </span>
 )}
 </div>
 <ul className="space-y-1">
 {checks.map((check) => (
 <li key={check.label} className="flex items-center gap-2 text-xs">
 <div
 className={cn(
 "w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-all duration-200",
 check.passed
 ? "border-success bg-success/10 text-success"
 : "border-border text-muted-foreground"
 )}
 >
 {check.passed && (
 <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
 </svg>
 )}
 </div>
 <span className={cn(check.passed ? "text-foreground/80" : "text-muted-foreground")}>
 {check.label}
 </span>
 </li>
 ))}
 </ul>
 </div>
 )
}
