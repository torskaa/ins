"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
 const [collapsed, setCollapsed] = useState(false)

 return (
 <div className="flex min-h-screen bg-[#fcfcfc]">
 <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
 <div className={cn("flex-1 transition-all duration-200", collapsed ? "ml-16" : "ml-60")}>
 <Header />
 <main className="p-6 lg:p-8">
 <div className="page-wrapper">{children}</div>
 </main>
 </div>
 </div>
 )
}
