"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import { DefaultContextBuilder, type AiContext } from "@/ai/context/types"
import { useAiChat, type ChatMessage, type StreamStep } from "@/hooks/use-ai-chat"
import { AiModeSelector, type AiMode } from "@/components/ai/ai-mode-selector"
import { RevealAnimation } from "@/components/ai/ai-loader"
import { type ActivityStep } from "@/components/ai/copilot-activity"
import { CopilotEmptyState } from "@/components/ai/copilot-empty-state"
import { CopilotErrorCard } from "@/components/ai/copilot-error-card"
import { CopilotActionCard } from "@/components/ai/copilot-action-card"
import { ArtifactCard } from "@/components/ai/artifact-card"
import { CopilotUserMessage, CopilotAssistantMessage } from "@/components/ai/copilot-message"
import { AiComposer } from "@/components/ai/ai-composer"
import { AgentOSPanel } from "@/components/ai/agent-os-panel"
import { WorkspaceSidebar } from "@/components/ai/workspace-sidebar"
import { useChatSessions } from "@/hooks/use-chat-sessions"
import { routeIntent } from "@/ai/copilot/intent/router"
import { createPlan, executePlanStep } from "@/ai/copilot/planner/planner"
import { registerAllActions } from "@/ai/actions/setup"
import type { CopilotPlan } from "@/ai/copilot/planner/types"
import { Sparkles, CheckCircle2, PanelLeft, PanelRightClose } from "lucide-react"
import { Timeline } from "@/components/ui/timeline"

registerAllActions()

const mockMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "user",
    content: "Show me inventory levels",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "m2",
    role: "assistant",
    content: `Here's your **inventory summary** across all warehouses:

| Warehouse | Items | Low Stock |
|-----------|-------|-----------|
| A | 542 | 8 |
| B | 398 | 12 |
| C | 307 | 3 |

**Total: 1,247 items** — 23 items below reorder threshold.

\`\`\`json
{
  "warehouses": 3,
  "totalItems": 1247,
  "lowStock": 23,
  "reorderUrgency": "medium"
}
\`\`\`

> Tip: Run \`check_stock --low-only\` to see items needing reorder.`,
    timestamp: new Date(Date.now() - 110000),
    toolCalls: [
      { toolName: "inventory.getStock", input: {}, output: JSON.stringify({ total: 1247, lowStock: 23 }), status: "success" },
      { toolName: "inventory.getWarehouses", input: {}, output: JSON.stringify({ warehouses: 3 }), status: "success" },
    ],
    actionSuggestions: [
      { id: "restock", label: "Restock low items", description: "Create purchase orders for 23 low-stock items", action: "purchasing.createDraft" },
      { id: "report", label: "Full inventory report", description: "Generate detailed inventory analysis report", action: "reports.generate" },
    ],
  },
  {
    id: "m3",
    role: "user",
    content: "What about Q3 sales?",
    timestamp: new Date(Date.now() - 60000),
  },
  {
    id: "m4",
    role: "assistant",
    content: `**Quarter 3 Sales Summary**

| Month | Revenue | Orders | Growth |
|-------|---------|--------|--------|
| July | $48,200 | 156 | +8% |
| August | $52,100 | 172 | +12% |
| September | $55,800 | 189 | +7% |

\`\`\`json
[
  { "month": "July", "revenue": 48200, "orders": 156, "growth": 8 },
  { "month": "August", "revenue": 52100, "orders": 172, "growth": 12 },
  { "month": "September", "revenue": 55800, "orders": 189, "growth": 7 }
]
\`\`\`

**Q3 Total: $156,100** across 517 orders. Trending **+14%** from last quarter.`,
    timestamp: new Date(Date.now() - 50000),
    toolCalls: [
      { toolName: "sales.getQuarterlyReport", input: { quarter: "Q3" }, output: JSON.stringify({ revenue: 156100, orders: 517, growth: 14 }), status: "success" },
    ],
    actionSuggestions: [
      { id: "export", label: "Export as PDF", description: "Download full report as PDF", action: "reports.export" },
      { id: "forecast", label: "View forecast", description: "See projected Q4 trends", action: "analytics.forecast" },
    ],
  },
]

const chartDemoMessages: ChatMessage[] = [
  {
    id: "cd1",
    role: "user",
    content: "Compare monthly revenue and expenses across product lines",
    timestamp: new Date(Date.now() - 300000),
  },
  {
    id: "cd2",
    role: "assistant",
    content: `Here's the **revenue breakdown by product line** for Q3 2024:

| Category | Revenue | Expenses | Profit | Margin |
|----------|---------|----------|--------|--------|
| Electronics | $142,000 | $98,000 | $44,000 | 31% |
| Office Supplies | $89,000 | $62,000 | $27,000 | 30% |
| Furniture | $67,000 | $51,000 | $16,000 | 24% |
| Software | $213,000 | $84,000 | $129,000 | 61% |
| Services | $156,000 | $112,000 | $44,000 | 28% |

\`\`\`json
[
  { "category": "Electronics", "revenue": 142000, "expenses": 98000, "profit": 44000 },
  { "category": "Office Supplies", "revenue": 89000, "expenses": 62000, "profit": 27000 },
  { "category": "Furniture", "revenue": 67000, "expenses": 51000, "profit": 16000 },
  { "category": "Software", "revenue": 213000, "expenses": 84000, "profit": 129000 },
  { "category": "Services", "revenue": 156000, "expenses": 112000, "profit": 44000 }
]
\`\`\`

**Software** leads with **$213K** revenue and **61%** margin. Here's the **key metrics snapshot**:

\`\`\`json
[
  {
    "title": "Total Revenue",
    "period": "Q3 2024",
    "value": "$667K",
    "color": "emerald",
    "data": [{ "value": 140000 }, { "value": 229000 }, { "value": 296000 }, { "value": 452000 }, { "value": 521000 }, { "value": 667000 }]
  },
  {
    "title": "Avg Margin",
    "period": "Across categories",
    "value": "34.8%",
    "color": "violet",
    "data": [{ "value": 28 }, { "value": 30 }, { "value": 32 }, { "value": 31 }, { "value": 33 }, { "value": 35 }]
  },
  {
    "title": "Total Orders",
    "period": "Q3 2024",
    "value": "18,945",
    "color": "blue",
    "data": [{ "value": 2500 }, { "value": 4200 }, { "value": 3800 }, { "value": 5100 }, { "value": 4800 }, { "value": 6100 }]
  }
]
\`\`\`

> Electronics and Services contribute similar profit amounts despite different revenue volumes.`,
    timestamp: new Date(Date.now() - 290000),
    toolCalls: [
      { toolName: "sales.getRevenueByCategory", input: { quarter: "Q3" }, output: "[]", status: "success" },
    ],
    actionSuggestions: [
      { id: "forecast", label: "View forecast", description: "See projected Q4 trends by category", action: "analytics.forecast" },
      { id: "export", label: "Export to spreadsheet", description: "Download full breakdown as CSV", action: "reports.export" },
    ],
  },
  {
    id: "cd3",
    role: "user",
    content: "Show me warehouse performance metrics",
    timestamp: new Date(Date.now() - 180000),
  },
  {
    id: "cd4",
    role: "assistant",
    content: `Here's the **warehouse performance comparison**:

| Warehouse | Capacity | Utilization | Orders/Day | Fulfillment Rate |
|-----------|----------|-------------|------------|-----------------|
| Central Hub | 50,000 | 78% | 342 | 97.2% |
| North Branch | 35,000 | 65% | 198 | 94.8% |
| South Depot | 42,000 | 82% | 267 | 96.1% |
| West Station | 28,000 | 91% | 312 | 93.5% |

\`\`\`json
[
  { "warehouse": "Central Hub", "capacity": 50000, "utilization": 78, "ordersPerDay": 342, "fulfillmentRate": 97.2 },
  { "warehouse": "North Branch", "capacity": 35000, "utilization": 65, "ordersPerDay": 198, "fulfillmentRate": 94.8 },
  { "warehouse": "South Depot", "capacity": 42000, "utilization": 82, "ordersPerDay": 267, "fulfillmentRate": 96.1 },
  { "warehouse": "West Station", "capacity": 28000, "utilization": 91, "ordersPerDay": 312, "fulfillmentRate": 93.5 }
]
\`\`\`

> **West Station** has the highest utilization (91%) — consider expanding capacity. **Central Hub** has the best fulfillment rate at 97.2%.`,
    timestamp: new Date(Date.now() - 170000),
    toolCalls: [
      { toolName: "warehouse.getPerformance", input: {}, output: "[]", status: "success" },
    ],
    actionSuggestions: [
      { id: "expand", label: "Plan expansion", description: "Evaluate West Station capacity expansion", action: "planning.createDraft" },
      { id: "report", label: "Full warehouse report", description: "Generate detailed performance report", action: "reports.generate" },
    ],
  },
]

const fullDemoMessages: ChatMessage[] = [
  {
    id: "fd1",
    role: "user",
    content: "Give me a full operational overview with KPIs, tables, and charts",
    timestamp: new Date(Date.now() - 600000),
  },
  {
    id: "fd2",
    role: "assistant",
    content: `# Operational Overview — Q3 2024

Here's a **comprehensive snapshot** across all business units. Below you'll find key metrics, comparisons, and detailed breakdowns.

---

## Key Performance Indicators

\`\`\`json
[
  {
    "title": "Total Revenue",
    "period": "Q3 2024",
    "value": "$1.2M",
    "color": "emerald",
    "data": [{ "value": 820000 }, { "value": 910000 }, { "value": 980000 }, { "value": 1050000 }, { "value": 1120000 }, { "value": 1200000 }]
  },
  {
    "title": "Active Customers",
    "period": "Net new this quarter",
    "value": "2,847",
    "color": "blue",
    "data": [{ "value": 1200 }, { "value": 1800 }, { "value": 2100 }, { "value": 2400 }, { "value": 2600 }, { "value": 2847 }]
  },
  {
    "title": "Profit Margin",
    "period": "Average across lines",
    "value": "31.2%",
    "color": "violet",
    "data": [{ "value": 24 }, { "value": 27 }, { "value": 29 }, { "value": 30 }, { "value": 31 }, { "value": 31 }]
  }
]
\`\`\`

## Department Comparison

| Department | Headcount | Budget | Spent | Remaining |
|------------|-----------|--------|-------|-----------|
| Engineering | 48 | $2.4M | $1.8M | $600K |
| Sales | 32 | $1.8M | $1.5M | $300K |
| Marketing | 24 | $1.2M | $1.1M | $100K |
| Operations | 38 | $1.6M | $1.2M | $400K |

\`\`\`json
[
  { "department": "Engineering", "budget": 2400000, "spent": 1800000 },
  { "department": "Sales", "budget": 1800000, "spent": 1500000 },
  { "department": "Marketing", "budget": 1200000, "spent": 1100000 },
  { "department": "Operations", "budget": 1600000, "spent": 1200000 }
]
\`\`\`

### Top Priorities This Month

1. **Scale engineering team** — 4 new backend hires by Oct 15
2. **Q4 marketing campaign** — Budget approval needed by Oct 1
3. **Warehouse automation** — Pilot phase starts Nov 1

> *"Efficiency is doing better what is already being done."* — Peter Drucker

### Quick Links

- View the full [Monthly Report](/reports/monthly)
- Check [Inventory Status](/inventory) for stock alerts
- Visit [Team Dashboard](/dashboard) for real-time data

---

> Engineering has used 75% of its budget, Sales 83%, Marketing 92%, and Operations 75%. Overall all departments are on track.

**Summary:** Engineering has the most remaining budget. Reach out to [ops@company.com](mailto:ops@company.com) for detailed reports.`,
    timestamp: new Date(Date.now() - 590000),
    toolCalls: [
      { toolName: "dashboard.overview", input: { quarter: "Q3" }, output: "{}", status: "success" },
    ],
    actionSuggestions: [
      { id: "report", label: "Generate full report", description: "Export detailed Q3 operational report as PDF", action: "reports.generate" },
      { id: "meeting", label: "Schedule review", description: "Set up quarterly review meeting with stakeholders", action: "calendar.create" },
    ],
  },
]

const mockPlan: CopilotPlan = {
  id: "plan-demo",
  summary: "Create purchase order for office supplies",
  status: "draft",
  createdAt: new Date().toISOString(),
  steps: [
    { id: "s1", type: "query", label: "Check existing inventory", description: "Search current stock levels", status: "completed", actionName: "inventory.search" },
    { id: "s2", type: "query", label: "Find recommended suppliers", description: "Find best suppliers for office supplies", status: "completed", actionName: "suppliers.search" },
    { id: "s3", type: "action", label: "Create purchase order draft", description: "Draft PO with selected items", status: "pending", actionName: "purchasing.createDraft" },
  ],
}

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

function deriveStepsFromMessages(messages: ChatMessage[]): ActivityStep[] {
  const seen = new Set<string>()
  const steps: ActivityStep[] = []
  for (const msg of messages) {
    if (msg.role === "assistant" && msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        if (seen.has(tc.toolName)) continue
        seen.add(tc.toolName)
        steps.push({
          id: `${msg.id}-${tc.toolName}`,
          label: tc.toolName,
          status: tc.status === "success" ? "completed" as const : tc.status === "error" ? "failed" as const : "pending" as const,
        })
      }
    }
  }
  return steps
}

export default function AiWorkspace({ onClose }: { onClose?: () => void }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const { messages, isLoading, streamSteps, queuedCount, sendMessage, clearMessages, loadMessages, cancel, editMessage } = useAiChat()
  const [input, setInput] = useState("")
  const [mode, setMode] = useState<AiMode>("ask")
  const [currentPlan, setCurrentPlan] = useState<CopilotPlan | null>(null)
  const [executing, setExecuting] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [contextFilter, setContextFilter] = useState<string | null>(null)
  const {
    sessions,
    activeSessionId,
    activeSession,
    setActiveSessionId,
    createSession,
    deleteSession,
    renameSession,
    updateSessionMessages,
  } = useChatSessions()
  const currentStatus = useMemo(() => {
    if (streamSteps.length === 0) return "Analyzing your request"
    const latest = streamSteps[streamSteps.length - 1]
    if (latest.status === "running") {
      switch (latest.type) {
        case "thinking": return "Analyzing your request"
        case "planning": return "Building response"
        case "tool_start": return latest.message ? `Running ${latest.message}` : "Processing"
        case "tool_result": return "Processing results"
        default: return "Working"
      }
    }
    return "Processing"
  }, [streamSteps])
  const scrollRef = useRef<HTMLDivElement>(null)
  const isTablet = useMediaQuery("(max-width: 1024px)")
  const effectiveRightPanelOpen = isTablet ? false : rightPanelOpen
  const displaySteps = useMemo(() => {
    if (streamSteps.length > 0) return buildActivitySteps(streamSteps)
    return deriveStepsFromMessages(messages)
  }, [streamSteps, messages])
  const switchingRef = useRef(false)
  const initialLoadRef = useRef(true)

  const filterLabels: Record<string, string> = {
    all: "All Context",
    inventory: "Inventory",
    orders: "Orders",
    crm: "CRM",
    finance: "Finance",
    projects: "Projects",
    warehouse: "Warehouse",
    purchasing: "Purchasing",
  }
  const contextLabel = contextFilter ? filterLabels[contextFilter] || contextFilter : detectContext(pathname)
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
      createSession(mockMessages)
      createSession(chartDemoMessages)
      createSession(fullDemoMessages)
      loadMessages(fullDemoMessages)
      setTimeout(() => setCurrentPlan(mockPlan), 600)
      return
    }
    if (activeSession && activeSession.messages.length > 0) {
      switchingRef.current = true
      loadMessages(activeSession.messages)
      setTimeout(() => { switchingRef.current = false }, 0)
    } else if (activeSession) {
      clearMessages()
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
    const userId = user?.id || "dev-user"
    const orgId = user?.activeOrganizationId || "dev-org"
    try {
      return new DefaultContextBuilder().build({
        userId,
        organizationId: orgId,
        organizationSlug: orgId.slice(0, 12),
        userRole: user?.role ?? "admin",
        permissions: user?.permissions ?? ["*"],
        currentModule: contextFilter ?? undefined,
      })
    } catch {
      return null
    }
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
    if ((mode === "create" || mode === "automate" || mode === "manage") && text.trim()) {
      const intent = routeIntent(text, mode)
      const plan = createPlan(intent)
      if (plan && plan.steps.length > 0) {
        setCurrentPlan(plan)
        return
      }
    }
    await sendMessage(text, ctx, true)
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

  async function handleSuggestionClick(text: string) {
    setInput(text)
    const ctx = buildContext()
    if (!ctx || isLoading || executing) return
    setCurrentPlan(null)
    await sendMessage(text, ctx, true)
  }

  function handleNewChat() {
    clearMessages()
    setCurrentPlan(null)
    setInput("")
    setMode("ask")
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
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        activeTag={contextFilter}
        onSelectTag={setContextFilter}
        disabled={isLoading || executing}
      />

      {/* Center Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border/10 shrink-0 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-success/10 flex items-center justify-center ring-1 ring-border/30">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">Ins Copilot</span>
                {contextFilter && (
                  <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 text-muted-foreground/50 border-border/40">
                    {contextFilter}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground/50 font-medium">Workspace</span>
              </div>
              <span className="text-xs text-muted-foreground/60">
                {activeSession ? activeSession.title : "Ask me anything about your business"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AiModeSelector value={mode} onChange={setMode} disabled={isLoading || executing} />
          </div>
        </div>

        {/* Build indicator */}
        {(isLoading || executing) && (
          <div className="relative h-0.5 bg-muted/30 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-info/40 to-primary/40 animate-gradient-x rounded-full" style={{ backgroundSize: "200% 100%" }} />
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          {messages.length === 0 && !currentPlan ? (
            <CopilotEmptyState onSuggestionClick={handleSuggestionClick} userName={userName} mode={mode} />
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) =>
                msg.role === "user" ? (
                  <div key={msg.id} className="flex justify-end">
                    <CopilotUserMessage
                      content={msg.content}
                      avatarUrl={userAvatar}
                      userName={userName}
                      onEdit={(newContent) => editMessage(msg.id, newContent)}
                    />
                  </div>
                ) : (
                  <div key={msg.id} className="space-y-3">
                    <CopilotAssistantMessage
                      content={msg.content}
                      timestamp={msg.timestamp}
                      streaming={isLoading && msg === messages[messages.length - 1]}
                      onRetry={handleRetry}
                      tag={contextFilter}
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
                        tag={contextFilter}
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
                    <div className="text-sm text-muted-foreground">
                      {currentStatus}
                    </div>
                  </RevealAnimation>
                </div>
              )}

              {currentPlan && (
                <div className="space-y-3">
                  <div className="rounded-xl bg-card/60 backdrop-blur-sm border border-border p-4">
                    <p className="text-sm text-muted-foreground mb-3">{currentPlan.summary}</p>
                    <Timeline
                      items={currentPlan.steps.map((s) => ({
                        id: s.id,
                        title: s.label,
                        description: s.description,
                        status: s.status === "running" ? "active" as const :
                                s.status === "completed" ? "completed" as const :
                                s.status === "failed" ? "error" as const :
                                "pending" as const,
                      }))}
                      variant="compact"
                      showTimestamps={false}
                    />
                    {currentPlan.status !== "completed" && !executing && (
                      <Button
                        onClick={handleExecutePlan}
                        className="h-8 rounded-lg text-xs font-medium mt-3"
                      >
                        Execute Plan
                      </Button>
                    )}
                    {currentPlan.status === "completed" && (
                      <div className="flex items-center gap-2 text-sm text-success pt-3 border-t border-border/20 mt-3">
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

        {/* Queue indicator */}
        {queuedCount > 0 && (
          <div className="shrink-0 px-6 py-1">
            <div className="max-w-3xl mx-auto flex items-center gap-2 text-xs text-muted-foreground">
              <div className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              {queuedCount} message{queuedCount > 1 ? "s" : ""} queued — sending when ready
            </div>
          </div>
        )}

        {/* Composer */}
        <div className="shrink-0 px-6 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
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
              onCancel={cancel}
            />
          </div>
        </div>
      </div>

      {/* AI Activity Panel */}
      <AgentOSPanel
        isLoading={isLoading}
        streamSteps={displaySteps}
        currentPlan={currentPlan}
        executing={executing}
        rightPanelOpen={effectiveRightPanelOpen}
        onTogglePanel={() => setRightPanelOpen((v) => !v)}
        onExecutePlan={handleExecutePlan}
        title={activeSession?.title || undefined}
      />

      {/* Toggle for right panel */}
      {!effectiveRightPanelOpen && (
        <button
          onClick={() => setRightPanelOpen(true)}
          className="fixed right-0 top-1/2 -translate-y-1/2 z-50 size-8 flex items-center justify-center rounded-l-lg bg-card/80 backdrop-blur-sm border-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelRightClose className="size-4 rotate-180" />
        </button>
      )}

      {/* Toggle for left sidebar */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-50 size-8 flex items-center justify-center rounded-r-lg bg-card/80 backdrop-blur-sm border-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <PanelLeft className="size-4" />
        </button>
      )}
    </div>
  )
}
