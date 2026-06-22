"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { cn } from "@/lib/utils"
import { AiWorkspaceModal } from "@/components/layout/ai-workspace-modal"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)

  return (
    <>
      <div className="flex min-h-screen bg-[#fcfcfc]">
        <Sidebar collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <div className={cn("flex-1 transition-all duration-200", collapsed ? "ml-16" : "ml-60")}>
          <Header onWorkspaceOpen={() => setWorkspaceOpen(true)} />
          <main className="p-6 lg:p-8">
            <div className="page-wrapper">{children}</div>
          </main>
        </div>
      </div>
      <AiWorkspaceModal open={workspaceOpen} onClose={() => setWorkspaceOpen(false)} />
    </>
  )
}
