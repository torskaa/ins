"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { DefaultContextBuilder, type AiContext } from "@/ai/context/types"
import { useAiChat, type ChatMessage, type StreamStep } from "@/hooks/use-ai-chat"
import { AiModeSelector, type AiMode } from "@/components/ai/ai-mode-selector"
import { AiLoader, RevealAnimation } from "@/components/ai/ai-loader"
import { type ActivityStep } from "@/components/ai/copilot-activity"
import { CopilotEmptyState } from "@/components/ai/copilot-empty-state"
import { CopilotErrorCard } from "@/components/ai/copilot-error-card"
import { CopilotActionCard } from "@/components/ai/copilot-action-card"
import { AiResponseCard } from "@/components/ai/ai-response-card"
import { ArtifactCard } from "@/components/ai/artifact-card"
import { AiComposer } from "@/components/ai/ai-composer"
import { AgentOSPanel } from "@/components/ai/agent-os-panel"
import { WorkspaceSidebar } from "@/components/ai/workspace-sidebar"
import { useChatSessions } from "@/hooks/use-chat-sessions"
import { routeIntent } from "@/ai/copilot/intent/router"
import { createPlan, executePlanStep } from "@/ai/copilot/planner/planner"
import { registerAllActions } from "@/ai/actions/setup"
import type { CopilotPlan } from "@/ai/copilot/planner/types"
import { Sparkles, CheckCircle2, PanelLeft, PanelRightClose, X, ArrowLeft } from "lucide-react"

registerAllActions()

const contextLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventory": "Inventory",
  "/stock-movements": "Stock Movements",
  "/materials": "Materials",
  "/orders": "Orders",
  "/crm": "CRM",
  "/quotations": "Quotations",
  "/invoices": "Invoices",
  "/knowledge/wiki": "Wiki",
  "/knowledge/training": "Training",
  "/knowledge/documents": "Documents",
  "/settings": "Settings",
  "/workspaces": "Workspaces",
}

function detectContext(pathname: string): string | null {
  if (!pathname) return null
  for (const [prefix, label] of Object.entries(contextLabels)) {
    if (pathname.startsWith(prefix)) return label
  }
  return null
}

function buildActivitySteps(streamSteps: StreamStep[]): ActivityStep[] {
  return streamSteps.map((s) => ({
    id: s.id || crypto.randomUUID(),
    label: s.label,
    status: s.status as ActivityStep["status"],
  }))
}

export default function AiWorkspace({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { messages, isLoading, streamSteps, sendMessage, clearMessages, loadMessages } = useAiChat()
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<AiMode>("ask")
  const [currentPlan, setCurrentPlan] = useState<CopilotPlan | null>(null)
  const [executing, setExecuting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [contextFilter, setContextFilter] = useState<string | null>(null)
  const {
    activeSessionId,
    activeSession,
    setActiveSessionId,
    createSession,
    updateSessionMessages,
  } = useChatSessions()
  const scrollRef = useRef<HTMLDivElement>(null)
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const effectiveRightPanelOpen = isTablet ? false : rightPanelOpen
  const switchingRef = useRef(false)
  const initialLoadRef = useRef(true)

  const contextLabel = detectContext(pathname)
  const userName = session?.user?.name || null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userAvatar = (session?.user as any)?.image || null

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamSteps, currentPlan])

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      return
    }
    if (activeSession && activeSession.messages.length > 0) {
      switchingRef.current = true
      loadMessages(activeSession.messages)
      setTimeout(() => { switchingRef.current = false }, 0)
    }
  }, [activeSessionId])

  useEffect(() => {
    if (!switchingRef.current && activeSessionId && messages.length > 0) {
      updateSessionMessages(activeSessionId, messages)
    }
  }, [messages, activeSessionId, updateSessionMessages])

  function buildContext(): AiContext | null {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = session?.user as any
    const userId = user?.id
    const orgId = user?.activeOrganizationId
    if (!userId || !orgId) return null
    return new DefaultContextBuilder().build({
      userId,
      organizationId: orgId,
      organizationSlug: orgId.slice(0, 12),
      userRole: user?.role ?? "member",
      permissions: user?.permissions ?? [],
    })
  }

  async function handleRetry() {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")
    if (!lastUserMsg || isLoading || executing) return
    setCurrentPlan(null)
    const ctx = buildContext()
    if (!ctx) return
    await sendMessage(lastUserMsg.content, ctx, true)
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || isLoading || executing) return
    setInput("")
    setCurrentPlan(null)
    const ctx = buildContext()
    if (!ctx) return
    if (mode === "create" || mode === "automate" || mode === "manage") {
      const intent = routeIntent(text, mode)
      const plan = createPlan(intent)
      setCurrentPlan(plan)
    } else {
      await sendMessage(text, ctx, true)
    }
  }

  async function handleExecutePlan() {
    if (!currentPlan) return
    setExecuting(true)
    const ctx = buildContext()
    if (!ctx) { setExecuting(false); return }
    const steps = [...currentPlan.steps]
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      steps[i] = { ...step, status: "running" }
      setCurrentPlan({ ...currentPlan, steps: [...steps], status: "executing" })
      if (step.type === "action" && step.actionName) {
        const result = await executePlanStep(step, ctx)
        steps[i] = { ...step, status: result.success ? "completed" : "failed" }
      } else {
        steps[i] = { ...step, status: "completed" }
      }
      setCurrentPlan({ ...currentPlan, steps: [...steps] })
    }
    setCurrentPlan((prev) => prev ? { ...prev, steps, status: "completed" } : null)
    setExecuting(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSuggestionClick(text: string) {
    setInput(text)
  }

  function handleNewChat() {
    clearMessages()
    createSession()
  }

  function handleSelectSession(id: string) {
    setActiveSessionId(id)
  }

  return (
    <div className="w-screen h-screen flex flex-row bg-background overflow-hidden">
      {/* Workspace Sidebar */}
      <WorkspaceSidebar
        open={sidebarOpen}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        onNewChat={handleNewChat}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Center Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/50 shrink-0 bg-background/90 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => (onClose ? onClose() : router.push("/dashboard"))}
              variant="ghost"
              className="rounded-lg h-9 px-3 text-sm gap-2 text-muted-foreground"
            >
              <ArrowLeft className="size-4" />
              Dashboard
            </Button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center ring-1 ring-border/30">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                {contextLabel ? (
                  <span className="text-sm font-semibold">{contextLabel}</span>
                ) : (
                  <span className="text-sm font-semibold">AI Copilot</span>
                )}
                <span className="text-xs text-muted-foreground/50 font-medium">Workspace</span>
              </div>
              <span className="text-xs text-muted-foreground/60">
                {activeSession ? activeSession.title : "Ask me anything about your business"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AiModeSelector value={mode} onChange={setMode} />
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
            >
              <PanelLeft className="size-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-6" ref={scrollRef}>
          {messages.length === 0 && !currentPlan ? (
            <CopilotEmptyState onSuggestionClick={handleSuggestionClick} userName={userName} mode={mode} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-[70%] rounded-lg bg-primary/10 px-4 py-2.5 text-sm text-foreground">
                      {msg.content}
                    </div>
                  </div>
                ) : (
                  <div key={msg.id} className="space-y-3">
                    <AiResponseCard
                      summary={msg.content}
                      toolCalls={msg.toolCalls}
                      timestamp={msg.timestamp}
                    />
                    {(() => {
                      const isPermError =
                        msg.content.includes("PERMISSION_DENIED") ||
                        msg.content.includes("permission_denied") ||
                        msg.content.includes("not authorized")
                      if (isPermError) return <CopilotErrorCard actionLabel="Request Access" />
                      return null
                    })()}
                    {msg.toolCalls && msg.toolCalls.length > 0 && !msg.content.includes("PERMISSION_DENIED") && (
                      <ArtifactCard
                        type="report"
                        title="Generated Report"
                        description="Automatically generated from analysis results"
                        status="draft"
                        timestamp={msg.timestamp}
                      />
                    )}
                    {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                      <CopilotActionCard
                        actions={msg.actionSuggestions.map((s) => ({ id: s.id, label: s.label, description: s.description }))}
                      />
                    )}
                  </div>
                ),
              )}

              {isLoading && (
                <div className="space-y-3">
                  <RevealAnimation delay={50}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AiLoader variant="dots" />
                      <span>Analyzing your request</span>
                    </div>
                  </RevealAnimation>
                </div>
              )}

              {currentPlan && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
                    <p className="text-sm text-muted-foreground">{currentPlan.summary}</p>
                    {currentPlan.steps.map((step, i) => (
                      <div key={step.id} className="flex items-center gap-3 text-sm">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                          step.status === "completed" && "bg-success/10 text-success",
                          step.status === "running" && "bg-info/10 text-info",
                          step.status === "pending" && "bg-muted/20 text-muted-foreground",
                          step.status === "failed" && "bg-destructive/10 text-destructive",
                        )}>
                          {step.status === "completed" ? <CheckCircle2 className="size-3.5" /> :
                           step.status === "running" ? <div className="size-2 rounded-full bg-current animate-pulse" /> :
                           step.status === "failed" ? <X className="size-3.5" /> :
                           <div className="size-1.5 rounded-full bg-current" />}
                        </div>
                        <span className={cn(
                          step.status === "completed" && "text-muted-foreground",
                          step.status === "running" && "text-foreground font-medium",
                        )}>{step.label}</span>
                        {step.status === "completed" && (
                          <span className="text-xs text-success ml-auto">Complete</span>
                        )}
                      </div>
                    ))}
                    {currentPlan.status !== "completed" && !executing && (
                      <Button
                        onClick={handleExecutePlan}
                        className="w-full h-9 rounded-lg text-sm font-medium mt-2"
                      >
                        Execute Plan
                      </Button>
                    )}
                    {currentPlan.status === "completed" && (
                      <div className="flex items-center gap-2 text-sm text-success pt-2 border-t border-border/20">
                        <CheckCircle2 className="size-4" />
                        All actions completed
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Composer */}
        <div className="shrink-0 border-t border-border/50">
          <div className="max-w-3xl mx-auto p-6">
            <AiComposer
              input={input}
              mode={mode}
              isLoading={isLoading}
              executing={executing}
              contextFilter={contextFilter}
              onInputChange={setInput}
              onSend={handleSend}
              onKeyDown={handleKeyDown}
              onContextFilterChange={setContextFilter}
            />
          </div>
        </div>
      </div>

      {/* AI Activity Panel */}
      <AgentOSPanel
        isLoading={isLoading}
        streamSteps={buildActivitySteps(streamSteps)}
        currentPlan={currentPlan}
        executing={executing}
        rightPanelOpen={effectiveRightPanelOpen}
        onTogglePanel={() => setRightPanelOpen((v) => !v)}
        onExecutePlan={handleExecutePlan}
      />

      {/* Toggle for right panel */}
      {!effectiveRightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 p-2 rounded-l-lg bg-card border border-r-0 border-border/50 text-muted-foreground hover:text-foreground shadow-sm"
        >
          <PanelRightClose className="size-4 rotate-180" />
        </button>
      )}
    </div>
  )
}
