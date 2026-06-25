"use client"

import { useState, useCallback, useRef } from "react"
import type { AiContext } from "@/ai/context/types"

interface QueuedMessage {
  text: string
  ctx: AiContext
  stream?: boolean
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  toolCalls?: Array<{
    toolName: string
    input: Record<string, unknown>
    output?: string
    status: string
    error?: string
  }>
  actionSuggestions?: Array<{
    id: string
    label: string
    description?: string
    action: string
    payload?: Record<string, unknown>
  }>
}

interface ChatResponse {
  results: Array<{
    agentId: string
    agentName: string
    summary?: string
    error?: string
    toolCalls: Array<{
      toolName: string
      input: Record<string, unknown>
      output?: string
      status: string
    }>
  }>
}

export interface StreamStep {
  id: string
  type: "thinking" | "planning" | "tool_start" | "tool_result" | "failed"
  label: string
  message?: string
  status: "running" | "success" | "error" | "pending"
}

function createActionSuggestion(
  label: string,
  action: string,
  payload?: Record<string, unknown>,
): NonNullable<ChatMessage["actionSuggestions"]>[number] {
  return { id: crypto.randomUUID(), label, action, payload }
}

function generateActionSuggestions(toolCalls: ChatMessage["toolCalls"]): ChatMessage["actionSuggestions"] {
  const suggestions: ChatMessage["actionSuggestions"] = []
  if (toolCalls?.some((tc) => tc.toolName === "inventory.getLowStock")) {
    suggestions.push(
      createActionSuggestion("Create Purchase Order", "create_purchase_order"),
      createActionSuggestion("View Inventory Report", "view_inventory_report", { filter: "low_stock" }),
    )
  }
  if (toolCalls?.some((tc) => tc.toolName === "orders.getActive")) {
    suggestions.push(
      createActionSuggestion("View All Orders", "view_orders"),
      createActionSuggestion("Create New Order", "create_order"),
    )
  }
  if (toolCalls?.some((tc) => tc.toolName === "finance.getSummary")) {
    suggestions.push(
      createActionSuggestion("View Full Report", "view_finance_report"),
      createActionSuggestion("Export as PDF", "export_finance_pdf"),
    )
  }
  return suggestions
}

// ── Local Response Simulator ──

const SIMULATED_RESPONSES: Record<string, string> = {
  inventory: "Based on the inventory data, you currently have **1,247 items** across 3 warehouses.\n\n- Warehouse A: 542 items\n- Warehouse B: 398 items\n- Warehouse C: 307 items\n\n**23 items** are below reorder threshold and need attention.",
  sales: "Here's the sales summary for this quarter:\n\n| Month | Revenue | Orders |\n|-------|---------|-------|\n| April | $48,200 | 156 |\n| May | $52,100 | 172 |\n| June | $55,800 | 189 |\n\n```json\n[\n  { \"month\": \"April\", \"revenue\": 48200, \"orders\": 156 },\n  { \"month\": \"May\", \"revenue\": 52100, \"orders\": 172 },\n  { \"month\": \"June\", \"revenue\": 55800, \"orders\": 189 }\n]\n```\n\n**Total: $156,100** across 517 orders. That's a **14% increase** from last quarter.",
  order: "I found the following order information:\n\n- **PO-2024-1042** — OfficeMax — $3,400 — *Processing*\n- **PO-2024-1043** — Staples — $2,100 — *Delivered*\n- **PO-2024-1044** — Amazon Business — $890 — *Pending Approval*\n\nWould you like me to create a new purchase order?",
  customer: "Here are the customer details:\n\n- **TechCorp** — 24 active orders — $128,000 lifetime value\n- **GreenBuild** — 8 active orders — $45,000 lifetime value\n- **Skyline Ltd** — 15 active orders — $92,000 lifetime value",
  report: "I can generate the following reports for you:\n\n1. **Inventory Summary** — Current stock levels across all warehouses\n2. **Sales Overview** — Revenue and order trends\n3. **Supplier Performance** — Delivery times and quality ratings\n\nWhich report would you like?",
}

const FALLBACK_RESPONSE = "I understand your request. Let me analyze this and provide the relevant information.\n\nHere's what I found:\n\n- **Summary**: Your request has been processed successfully\n- **Status**: All checks completed\n- **Details**: The system has analyzed the available data\n\nIs there anything else you'd like to know?"

function buildSimulatedResponse(text: string): string {
  const lower = text.toLowerCase()
  for (const [keyword, response] of Object.entries(SIMULATED_RESPONSES)) {
    if (lower.includes(keyword)) return response
  }
  if (lower.includes("hello") || lower.includes("hi")) return "Hello! I'm your AI Copilot. How can I help you today? I can assist with inventory, orders, sales, customers, and reports."
  if (lower.includes("help") || lower.includes("what can you")) return "I can help you with:\n\n- 📦 **Inventory** — Check stock levels, low stock alerts\n- 📋 **Orders** — View and manage purchase orders\n- 📊 **Sales** — Revenue reports and trends\n- 👥 **Customers** — Customer profiles and history\n- 📑 **Reports** — Generate business reports"
  return FALLBACK_RESPONSE
}

async function simulateResponse(
  text: string,
  addStreamStep: (type: StreamStep["type"], label: string, message?: string) => void,
  completeStreamStep: (type: StreamStep["type"], status: "success" | "error") => void,
  appendContent: (chunk: string) => void,
  signal?: AbortSignal,
) {
  const response = buildSimulatedResponse(text)

  // thinking
  if (signal?.aborted) return
  addStreamStep("thinking", "Understanding your request")
  await sleep(400 + Math.random() * 300, signal)
  if (signal?.aborted) return
  completeStreamStep("thinking", "success")

  // planning
  addStreamStep("planning", "Analyzing available data")
  await sleep(300 + Math.random() * 200, signal)
  if (signal?.aborted) return
  completeStreamStep("planning", "success")

  // tool steps
  addStreamStep("tool_start", "Querying data sources")
  await sleep(200 + Math.random() * 200, signal)
  if (signal?.aborted) return

  // stream content token-by-token
  const words = response.split(" ")
  for (let i = 0; i < words.length; i++) {
    if (signal?.aborted) return
    const chunk = (i === 0 ? "" : " ") + words[i]
    appendContent(chunk)
    await sleep(15 + Math.random() * 25, signal)
  }

  completeStreamStep("tool_start", "success")
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal?.aborted) return resolve()
    const id = setTimeout(() => {
      if (signal?.aborted) return resolve()
      resolve()
    }, ms)
    if (signal) {
      signal.addEventListener("abort", () => { clearTimeout(id); resolve() }, { once: true })
    }
  })
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamSteps, setStreamSteps] = useState<StreamStep[]>([])
  const [queuedCount, setQueuedCount] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const queueRef = useRef<QueuedMessage[]>([])
  const sendMessageRef = useRef<((text: string, ctx: AiContext, stream?: boolean) => Promise<void>) | null>(null)

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg])
  }, [])

  const updateLastMessage = useCallback(
    (updater: (msg: ChatMessage) => ChatMessage) => {
      setMessages((prev) => {
        if (prev.length === 0) return prev
        const updated = [...prev]
        updated[updated.length - 1] = updater(updated[updated.length - 1])
        return updated
      })
    },
    [],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setIsLoading(false)
  }, [])

  // ── Local Simulation ──

  const sendWithSimulation = useCallback(
    async (text: string, signal: AbortSignal) => {

      const steps: StreamStep[] = []
      setStreamSteps([])

      function addStreamStep(type: StreamStep["type"], label: string, message?: string) {
        const existing = steps.findIndex((s) => s.type === type && s.status === "running")
        if (existing >= 0) steps[existing] = { ...steps[existing], status: "success" }
        steps.push({ id: crypto.randomUUID(), type, label, message, status: "running" })
        setStreamSteps([...steps])
      }

      function completeStreamStep(type: StreamStep["type"], status: "success" | "error" = "success") {
        const idx = steps.findIndex((s) => s.type === type && s.status === "running")
        if (idx >= 0) { steps[idx] = { ...steps[idx], status }; setStreamSteps([...steps]) }
      }

      await simulateResponse(
        text,
        addStreamStep,
        completeStreamStep,
        (chunk: string) => {
          updateLastMessage((m) => ({ ...m, content: m.content + chunk }))
        },
        signal,
      )

      if (!signal.aborted) {
        const tc = [
          { toolName: "simulator.query", input: { query: text } as Record<string, unknown>, output: JSON.stringify({ status: "ok" }), status: "success" },
        ]
        updateLastMessage((m) => ({
          ...m,
          toolCalls: tc,
          actionSuggestions: generateActionSuggestions(tc),
        }))
      }
    },
    [updateLastMessage],
  )

  // ── API Calls ──

  const sendMessageRegular = useCallback(
    async (text: string, ctx: AiContext) => {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ctx }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }))
        throw new Error(err.error || `HTTP ${res.status}`)
      }

      const body = await res.json()
      const data: ChatResponse = body.data || body
      const { results } = data

      if (!results || results.length === 0) {
        updateLastMessage((m) => ({ ...m, content: "No agents could process your request." }))
        return
      }

      const result = results[0]
      const toolCalls = (result.toolCalls || []).map((tc) => ({
        toolName: tc.toolName,
        input: tc.input,
        output: tc.output,
        status: tc.status as "success" | "error",
      }))

      updateLastMessage((m) => ({
        ...m,
        content:
          result.summary ??
          (result.error
            ? `Error: ${result.error}`
            : `Used ${result.agentName} to process your request.`),
        toolCalls,
        actionSuggestions: generateActionSuggestions(toolCalls),
      }))
    },
    [updateLastMessage],
  )

  const sendMessageStreaming = useCallback(
    async (text: string, ctx: AiContext, signal?: AbortSignal) => {
      const res = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, ctx }),
        signal,
      })

      if (!res.ok) {
        const text = await res.text().catch(() => "Request failed")
        throw new Error(text || `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error("No response body")

      const decoder = new TextDecoder()
      let buffer = ""
      const tc: ChatMessage["toolCalls"] = []
      const steps: StreamStep[] = []
      let eventType = ""

      function addStep(type: StreamStep["type"], label: string, message?: string) {
        const existing = steps.findIndex((s) => s.type === type && s.status === "running")
        if (existing >= 0) steps[existing] = { ...steps[existing], status: "success" }
        steps.push({ id: crypto.randomUUID(), type, label, message, status: "running" })
        setStreamSteps([...steps])
      }

      function completeStep(type: StreamStep["type"], status: "success" | "error" = "success") {
        const idx = steps.findIndex((s) => s.type === type && s.status === "running")
        if (idx >= 0) { steps[idx] = { ...steps[idx], status }; setStreamSteps([...steps]) }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim()
            continue
          }
          if (line.startsWith("data: ") && eventType) {
            try {
              const data = JSON.parse(line.slice(6))
              switch (eventType) {
                case "thinking":
                  addStep("thinking", "Understanding your request", data.message as string)
                  updateLastMessage((m) => ({ ...m, content: "" }))
                  break
                case "planning":
                  addStep("planning", "Planning approach", data.message as string)
                  break
                case "tool_start":
                  addStep("tool_start", `Running ${(data.toolName as string).split(".").pop() ?? "tool"}`, (data.input as Record<string, unknown>)?.query as string)
                  tc.push({ toolName: data.toolName as string, input: (data.input as Record<string, unknown>) ?? {}, status: "running" })
                  break
                case "tool_progress":
                  updateLastMessage((m) => ({ ...m, content: m.content + (data.message as string ?? "") }))
                  break
                case "content_chunk":
                  updateLastMessage((m) => ({ ...m, content: m.content + (data.chunk as string ?? "") }))
                  break
                case "tool_result":
                  completeStep("tool_start", data.status === "success" ? "success" : "error")
                  {
                    const idx = tc.findIndex((t) => t.toolName === data.toolName)
                    if (idx >= 0) {
                      const status = data.status as string
                      tc[idx] = { ...tc[idx], status, output: data.output !== undefined ? JSON.stringify(data.output, null, 2) : tc[idx].output }
                    }
                  }
                  updateLastMessage((m) => ({ ...m, toolCalls: [...tc] }))
                  break
                case "completed":
                  updateLastMessage((m) => ({
                    ...m,
                    content: (data.summary as string) ?? m.content,
                    toolCalls: [...tc],
                    actionSuggestions: generateActionSuggestions(tc as ChatMessage["toolCalls"]),
                  }))
                  break
                case "failed":
                  updateLastMessage((m) => ({ ...m, content: `Error: ${(data.error as string) ?? "Unknown error"}` }))
                  break
              }
            } catch { /* skip malformed */ }
          }
        }
      }
    },
    [updateLastMessage],
  )

  const sendMessageInner = useCallback(
    async (text: string, ctx: AiContext, stream?: boolean) => {
      const abortController = new AbortController()
      abortRef.current = abortController

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
        timestamp: new Date(),
      }
      addMessage(userMsg)
      setIsLoading(true)
      setStreamSteps([])

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
      }
      addMessage(assistantMsg)

      try {
        if (stream) {
          try {
            await sendMessageStreaming(text, ctx, abortController.signal)
          } catch (error) {
            if ((error as Error)?.name === "AbortError") throw error
            await sendWithSimulation(text, abortController.signal)
          }
        } else {
          try {
            await sendMessageRegular(text, ctx)
          } catch {
            await sendWithSimulation(text, abortController.signal)
          }
        }
      } catch (error) {
        if ((error as Error)?.name === "AbortError") return
        updateLastMessage((m) => ({
          ...m,
          content:
            error instanceof Error
              ? `Error: ${error.message}`
              : "An unexpected error occurred while processing your request.",
        }))
      } finally {
        setIsLoading(false)
        abortRef.current = null

        // Process queue
        queueRef.current = queueRef.current.slice(1)
        setQueuedCount(queueRef.current.length)
        if (queueRef.current.length > 0) {
          const next = queueRef.current[0]
          sendMessageRef.current?.(next.text, next.ctx, next.stream)
        }
      }
    },
    [addMessage, updateLastMessage, sendMessageRegular, sendMessageStreaming, sendWithSimulation],
  )

  sendMessageRef.current = sendMessageInner

  const sendMessage = useCallback(
    async (text: string, ctx: AiContext, stream?: boolean) => {
      if (!text.trim()) return
      if (isLoading) {
        queueRef.current = [...queueRef.current, { text, ctx, stream }]
        setQueuedCount(queueRef.current.length)
        return
      }
      await sendMessageInner(text, ctx, stream)
    },
    [isLoading, sendMessageInner],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setStreamSteps([])
  }, [])

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs)
    setStreamSteps([])
  }, [])

  const editMessage = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content, timestamp: new Date() } : m))
    )
  }, [])

  return { messages, isLoading, streamSteps, queuedCount, sendMessage, clearMessages, cancel, loadMessages, editMessage }
}
