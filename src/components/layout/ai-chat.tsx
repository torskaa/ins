"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Conversation, ConversationContent } from "@/components/ui/conversation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { DefaultContextBuilder, type AiContext } from "@/ai/context/types"
import { useAiChat, type ChatMessage, type StreamStep } from "@/hooks/use-ai-chat"
import { AiModeSelector, type AiMode } from "@/components/ai/ai-mode-selector"
import { CopilotEmptyState } from "@/components/ai/copilot-empty-state"
import { CopilotUserMessage, CopilotAssistantMessage, CopilotLoadingDots } from "@/components/ai/copilot-message"
import { CopilotActivity, type ActivityStep } from "@/components/ai/copilot-activity"
import { CopilotResultCard } from "@/components/ai/copilot-result-card"
import { CopilotErrorCard } from "@/components/ai/copilot-error-card"
import { CopilotActionCard } from "@/components/ai/copilot-action-card"
import { AiLoader, RevealAnimation } from "@/components/ai/ai-loader"
import { PlanCard } from "@/components/ai/plan-card"
import { ChatSidebar } from "@/components/ai/chat-sidebar"
import { useChatSessions } from "@/hooks/use-chat-sessions"
import { routeIntent } from "@/ai/copilot/intent/router"
import { createPlan, executePlanStep } from "@/ai/copilot/planner/planner"
import { registerAllActions } from "@/ai/actions/setup"
import type { CopilotPlan } from "@/ai/copilot/planner/types"
import {
  BotMessageSquare,
  Trash2,
  X,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  Search,
  Paperclip,
  Keyboard,
  PanelLeft,
} from "lucide-react"

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

function detectResultType(toolCalls?: ChatMessage["toolCalls"]): "inventory" | "orders" | "finance" | "sales" | "general" {
  if (!toolCalls || toolCalls.length === 0) return "general"
  const tc = toolCalls[0]
  if (tc.toolName.startsWith("inventory")) return "inventory"
  if (tc.toolName.startsWith("orders") || tc.toolName.startsWith("customers")) return "orders"
  if (tc.toolName.startsWith("sales")) return "sales"
  if (tc.toolName.startsWith("finance")) return "finance"
  return "general"
}

function buildActivitySteps(streamSteps: StreamStep[]): ActivityStep[] {
  return streamSteps.map((s) => ({
    id: s.id || crypto.randomUUID(),
    label: s.label,
    status: s.status as ActivityStep["status"],
  }))
}

export function AiChat() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { messages, isLoading, streamSteps, sendMessage, clearMessages, cancel, loadMessages } = useAiChat()
  const [input, setInput] = useState("")
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AiMode>("ask")
  const [currentPlan, setCurrentPlan] = useState<CopilotPlan | null>(null)
  const [executing, setExecuting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    tree,
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
    updateSessionMessages,
    moveToFolder,
    createFolder,
    deleteFolder,
    renameFolder,
  } = useChatSessions()
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

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
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Track whether we're switching sessions vs. new messages
  const switchingRef = useRef(false)
  const initialLoadRef = useRef(true)

  // Load session messages when switching active session
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false
      return
    }
    if (activeSession && activeSession.messages.length > 0) {
      switchingRef.current = true
      loadMessages(activeSession.messages)
      setTimeout(() => {
        switchingRef.current = false
      }, 0)
    }
  }, [activeSessionId])

  // Save messages to active session when they change (not during switching)
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
    if (!ctx) {
      setExecuting(false)
      return
    }

    const steps = [...currentPlan.steps]
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]
      steps[i] = { ...step, status: "running" }
      setCurrentPlan({ ...currentPlan, steps: [...steps], status: "executing" })

      if (step.type === "action" && step.actionName) {
        const result = await executePlanStep(step, ctx)
        steps[i] = {
          ...step,
          status: result.success ? "completed" : "failed",
        }
      } else {
        steps[i] = { ...step, status: "completed" }
      }

      setCurrentPlan({ ...currentPlan, steps: [...steps] })
    }

    setCurrentPlan((prev) =>
      prev ? { ...prev, steps, status: "completed" } : null,
    )
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

  const placeholderText =
    mode === "ask" ? "Ask me anything..." :
    mode === "analyze" ? "Ask me anything..." :
    mode === "create" ? "Describe what to create..." :
    mode === "automate" ? "Describe what to automate..." :
    "Describe what to manage..."

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="relative h-8 w-8"
        >
          <BotMessageSquare className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "p-0 flex flex-col gap-0",
          "w-full",
        )}
      >
        <div className="flex flex-row h-full">
          <ChatSidebar
            tree={tree}
            activeSessionId={activeSessionId}
            open={sidebarOpen}
            onNewChat={handleNewChat}
            onSelectSession={handleSelectSession}
            onDeleteSession={deleteSession}
            onRenameSession={renameSession}
            onMoveToFolder={moveToFolder}
            onCreateFolder={createFolder}
            onDeleteFolder={deleteFolder}
            onRenameFolder={renameFolder}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex-1 flex flex-col min-w-0">
        <SheetHeader className="px-4 py-3 border-b border-border/60 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setSidebarOpen((v) => !v)}
                className="text-muted-foreground hover:text-foreground"
              >
                <PanelLeft className="w-3.5 h-3.5" />
              </Button>
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center ring-1 ring-border/20">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <SheetTitle className="text-sm font-semibold">
                {activeSession ? (
                  <span className="truncate max-w-[120px] inline-block align-bottom">{activeSession.title}</span>
                ) : (
                  "AI Copilot"
                )}
              </SheetTitle>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={clearMessages}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <AiModeSelector value={mode} onChange={setMode} />
            {contextLabel && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-card/50 text-[11px] text-muted-foreground">
                <MapPin className="w-2.5 h-2.5" />
                {contextLabel}
              </div>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          {messages.length === 0 && !currentPlan ? (
            <CopilotEmptyState onSuggestionClick={handleSuggestionClick} userName={userName} mode={mode} />
          ) : (
            <Conversation className="relative w-full pb-2">
              <ConversationContent>
                {messages.map((msg) =>
                  msg.role === "user" ? (
                    <CopilotUserMessage key={msg.id} content={msg.content} avatarUrl={userAvatar} userName={userName} />
                  ) : (
                    <div key={msg.id} className="flex flex-col gap-2">
                      <CopilotAssistantMessage
                        content={msg.content}
                        timestamp={msg.timestamp}
                        onRetry={handleRetry}
                      />

                    {(() => {
                      const isPermError =
                        msg.content.includes("PERMISSION_DENIED") ||
                        msg.content.includes("permission_denied") ||
                        msg.content.includes("not authorized")
                      if (isPermError) {
                        return <CopilotErrorCard actionLabel="Request Access" />
                      }
                      return null
                    })()}

                    {msg.toolCalls && msg.toolCalls.length > 0 && !msg.content.includes("PERMISSION_DENIED") && (
                      <CopilotResultCard
                        type={detectResultType(msg.toolCalls)}
                        summary={msg.content}
                      />
                    )}

                    {msg.actionSuggestions && msg.actionSuggestions.length > 0 && (
                      <CopilotActionCard
                        actions={msg.actionSuggestions.map((s) => ({
                          id: s.id,
                          label: s.label,
                          description: s.description,
                        }))}
                      />
                    )}
                  </div>
                ),
              )}

              {isLoading && streamSteps.length > 0 && (
                <RevealAnimation delay={100} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CopilotLoadingDots />
                    <AiLoader variant="shimmer-text" text="Thinking..." />
                  </div>
                  <div className="ml-10 space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-muted-foreground/70">Steps</span>
                    </div>
                    <CopilotActivity steps={buildActivitySteps(streamSteps)} />
                    <div className="pt-1">
                      <AiLoader variant="loading-line" className="max-w-[120px]" />
                    </div>
                  </div>
                </RevealAnimation>
              )}

              {isLoading && streamSteps.length === 0 && (
                <RevealAnimation delay={50}>
                  <div className="flex items-center gap-3">
                    <CopilotLoadingDots />
                    <AiLoader variant="shimmer-text" text="Thinking..." />
                  </div>
                </RevealAnimation>
              )}

              {currentPlan && (
                <div className="space-y-3">
                  <CopilotAssistantMessage
                    content={`I'll help you ${currentPlan.summary.toLowerCase()}. Here's my plan:`}
                    timestamp={new Date()}
                  />
                  <div className="ml-10">
                    <PlanCard
                      plan={currentPlan}
                      onApprove={handleExecutePlan}
                      readOnly={executing || currentPlan.status === "completed"}
                    />
                    {currentPlan.status === "completed" && (
                      <div className="flex items-center gap-2 mt-2 text-xs text-success">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        All actions completed
                      </div>
                    )}
                  </div>
                </div>
              )}
                </ConversationContent>
              </Conversation>
          )}
        </ScrollArea>

        <div className="shrink-0 border-t border-border/60 p-3">
          <div className="relative flex-col rounded-md ring-1 ring-border">
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholderText}
                disabled={isLoading || executing}
                className="peer bg-transparent min-h-[44px] resize-none rounded-b-none border-none py-2.5 ps-9 pe-9 shadow-none"
              />

              <div className="pointer-events-none absolute start-0 top-[11px] flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
                <Search className="size-4" />
              </div>

              <button
                className="absolute end-0 bottom-0 flex h-9 w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-colors outline-none hover:text-foreground focus:z-10 focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading || executing}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                  className="size-4"
                >
                  <path
                    fill="currentColor"
                    fillRule="evenodd"
                    d="M5.25 8a6.75 6.75 0 0 1 13.5 0v5a6.75 6.75 0 0 1-13.5 0zM12 2.75A5.25 5.25 0 0 0 6.75 8v5a5.25 5.25 0 1 0 10.5 0V8c0-2.9-2.35-5.25-5.25-5.25m-1.485 4.295a.75.75 0 0 1-1.06-1.06l.534.504a37 37 0 0 1-.533-.505v-.001l.002-.002l.004-.003l.008-.008l.064-.06q.054-.047.139-.106c.113-.078.268-.167.473-.25c.41-.165 1.008-.304 1.854-.304s1.444.139 1.854.305c.205.083.36.17.473.249a2 2 0 0 1 .203.166l.008.008l.004.003l.001.002h.001c0 .001.001.002-.533.506l.534-.504a.75.75 0 0 1-1.068 1.055a1 1 0 0 0-.186-.095c-.207-.084-.61-.195-1.291-.195s-1.084.111-1.291.195a1 1 0 0 0-.194.1m0 3.001a.75.75 0 0 1-1.06-1.061L10 9.5a46 46 0 0 1-.544-.516v-.001l.002-.002l.004-.003l.008-.008l.064-.06q.054-.047.139-.106c.113-.078.268-.167.473-.25c.41-.165 1.008-.304 1.854-.304s1.444.139 1.854.305c.205.082.36.17.473.249a2 2 0 0 1 .203.166l.008.008l.004.003l.001.002h.001c0 .001.001.002-.544.517l.545-.515a.75.75 0 0 1-1.06 1.06l-.008-.005a1 1 0 0 0-.186-.095c-.207-.084-.61-.195-1.291-.195s-1.084.111-1.291.195a1 1 0 0 0-.186.095zm2.942-.029h-.001M3 10.25a.75.75 0 0 1 .75.75v2a8.25 8.25 0 0 0 16.5 0v-2a.75.75 0 0 1 1.5 0v2c0 5.385-4.365 9.75-9.75 9.75S2.25 18.385 2.25 13v-2a.75.75 0 0 1 .75-.75"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="flex items-center justify-between rounded-b-md border-t bg-card px-3 py-2">
              <Select defaultValue="gpt-4">
                <SelectTrigger size="sm" className="h-7 bg-background text-xs w-[90px] text-muted-foreground">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="text-xs" value="gpt-4">GPT-4</SelectItem>
                  <SelectItem className="text-xs" value="gpt-3.5">GPT-3.5</SelectItem>
                  <SelectItem className="text-xs" value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem className="text-xs" value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16k</SelectItem>
                  <SelectItem className="text-xs" value="gpt-4-32k">GPT-4 32k</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button className="h-7 px-2 gap-2 text-xs text-muted-foreground" variant="ghost">
                  <Paperclip className="size-3.5 text-muted-foreground" />
                  Attach
                </Button>
                <Button className="h-7 px-2 gap-2 text-xs text-muted-foreground" variant="ghost">
                  <Keyboard className="size-3.5 text-muted-foreground" />
                  Shortcuts
                </Button>
              </div>
            </div>
          </div>
        </div>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
