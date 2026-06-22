"use client"

import { useState, useCallback, useRef } from "react"
import type { AiContext } from "@/ai/context/types"
import type { CopilotEventType } from "@/ai/copilot/events"

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

function createActionSuggestion(
  label: string,
  action: string,
  payload?: Record<string, unknown>,
): NonNullable<ChatMessage["actionSuggestions"]>[number] {
  return { id: crypto.randomUUID(), label, action, payload }
}

function generateActionSuggestions(
  toolCalls: ChatMessage["toolCalls"],
): ChatMessage["actionSuggestions"] {
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

export interface StreamStep {
  id: string
  type: "thinking" | "planning" | "tool_start" | "tool_result" | "failed"
  label: string
  message?: string
  status: "running" | "success" | "error" | "pending"
}

export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamSteps, setStreamSteps] = useState<StreamStep[]>([])
  const abortRef = useRef<AbortController | null>(null)

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
      const toolCalls = result.toolCalls.map((tc) => ({
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

      const toolCalls: ChatMessage["toolCalls"] = []
      const steps: StreamStep[] = []
      let eventType = ""

      function addStep(type: StreamStep["type"], label: string, message?: string) {
        const existing = steps.findIndex((s) => s.type === type && s.status === "running")
        if (existing >= 0) {
          steps[existing] = { ...steps[existing], status: "success" }
        }
        steps.push({
          id: crypto.randomUUID(),
          type,
          label,
          message,
          status: "running",
        })
        setStreamSteps([...steps])
      }

      function completeStep(type: StreamStep["type"], status: "success" | "error" = "success") {
        const idx = steps.findIndex((s) => s.type === type && s.status === "running")
        if (idx >= 0) {
          steps[idx] = { ...steps[idx], status }
          setStreamSteps([...steps])
        }
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim() as CopilotEventType | ""
            continue
          }
          if (line.startsWith("data: ") && eventType) {
            try {
              const data = JSON.parse(line.slice(6))
              handleCopilotEvent(eventType as CopilotEventType, data, updateLastMessage, toolCalls)
              switch (eventType) {
                case "thinking":
                  addStep("thinking", "Understanding your request", data.message as string)
                  break
                case "planning":
                  addStep("planning", "Planning approach", data.message as string)
                  break
                case "tool_start":
                  addStep("tool_start", `Running ${(data.toolName as string).split(".").pop() ?? "tool"}`, (data.input as Record<string, unknown>)?.query as string)
                  break
                case "tool_result":
                  completeStep("tool_start", data.status === "success" ? "success" : "error")
                  if (data.status === "error") {
                    addStep("failed", "Failed", data.error as string)
                  }
                  break
                case "failed":
                  addStep("failed", "Failed", data.error as string)
                  break
              }
            } catch {
              // skip malformed data
            }
          }
        }
      }
    },
    [updateLastMessage],
  )

  const sendMessage = useCallback(
    async (text: string, ctx: AiContext, stream?: boolean) => {
      if (!text.trim() || isLoading) return

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
          await sendMessageStreaming(text, ctx, abortController.signal)
        } else {
          await sendMessageRegular(text, ctx)
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
      }
    },
    [isLoading, addMessage, updateLastMessage, sendMessageRegular, sendMessageStreaming, setStreamSteps],
  )

  const clearMessages = useCallback(() => {
    setMessages([])
    setStreamSteps([])
  }, [setStreamSteps])

  const loadMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages(msgs)
    setStreamSteps([])
  }, [setStreamSteps])

  return { messages, isLoading, streamSteps, sendMessage, clearMessages, cancel, loadMessages }
}

function handleCopilotEvent(
  eventType: CopilotEventType,
  data: Record<string, unknown>,
  updateLastMessage: (updater: (msg: ChatMessage) => ChatMessage) => void,
  toolCalls: ChatMessage["toolCalls"],
) {
  const tc = toolCalls ?? []
  switch (eventType) {
    case "thinking":
      updateLastMessage((m) => ({
        ...m,
        content: `Thinking... ${(data.message as string) ?? ""}`,
      }))
      break

    case "planning":
      updateLastMessage((m) => ({
        ...m,
        content: `Planning... ${(data.message as string) ?? ""}`,
      }))
      break

    case "tool_start":
      tc.push({
        toolName: data.toolName as string,
        input: (data.input as Record<string, unknown>) ?? {},
        status: "running",
      })
      updateLastMessage((m) => ({ ...m, toolCalls: [...tc] }))
      break

    case "tool_progress":
      updateLastMessage((m) => ({
        ...m,
        content: (data.message as string) ?? m.content,
      }))
      break

    case "tool_result":
      {
        const idx = tc.findIndex((t) => t.toolName === data.toolName)
        if (idx >= 0) {
          const status = data.status as string
          const output = data.output !== undefined ? JSON.stringify(data.output, null, 2) : undefined
          const error = data.error as string | undefined
          tc[idx] = {
            ...tc[idx],
            status,
            output: output ?? tc[idx].output,
            error: error ?? tc[idx].error,
          }
        }
        updateLastMessage((m) => ({ ...m, toolCalls: [...tc] }))
      }
      break

    case "approval_required":
      tc.push({
        toolName: data.toolName as string,
        input: (data.input as Record<string, unknown>) ?? {},
        status: "waiting_approval",
      })
      updateLastMessage((m) => ({
        ...m,
        toolCalls: [...tc],
        content: `Approval required for "${data.toolName as string}"`,
      }))
      break

    case "completed":
      updateLastMessage((m) => ({
        ...m,
        content: (data.summary as string) ?? m.content,
        toolCalls: [...tc],
        actionSuggestions: generateActionSuggestions(tc),
      }))
      break

    case "failed":
      updateLastMessage((m) => ({
        ...m,
        content: `Error: ${(data.error as string) ?? "Unknown error"}`,
      }))
      break
  }
}
