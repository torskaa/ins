"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
 return (
 <SessionProvider>
 <ThemeProvider>
 <TooltipProvider>{children}</TooltipProvider>
 </ThemeProvider>
 </SessionProvider>
 )
}
