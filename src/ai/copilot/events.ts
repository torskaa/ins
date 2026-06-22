export const CopilotEventTypes = [
  "thinking",
  "planning",
  "tool_start",
  "tool_progress",
  "tool_result",
  "approval_required",
  "completed",
  "failed",
] as const

export type CopilotEventType = (typeof CopilotEventTypes)[number]

import { validateEvent } from "./event-validator"

export interface CopilotEventBase {
  type: CopilotEventType
  timestamp: string
}

export interface ThinkingEvent extends CopilotEventBase {
  type: "thinking"
  agentId?: string
  message: string
}

export interface PlanningEvent extends CopilotEventBase {
  type: "planning"
  agentId?: string
  message: string
  stepCount?: number
}

export interface ToolStartEvent extends CopilotEventBase {
  type: "tool_start"
  agentId?: string
  toolName: string
  input: Record<string, unknown>
}

export interface ToolProgressEvent extends CopilotEventBase {
  type: "tool_progress"
  agentId?: string
  toolName: string
  message: string
}

export interface ToolResultEvent extends CopilotEventBase {
  type: "tool_result"
  agentId?: string
  toolName: string
  status: "success" | "error"
  output?: unknown
  error?: string
  durationMs?: number
}

export interface ApprovalRequiredEvent extends CopilotEventBase {
  type: "approval_required"
  agentId?: string
  toolName: string
  input: Record<string, unknown>
  reason: string
}

export interface CompletedEvent extends CopilotEventBase {
  type: "completed"
  agentId?: string
  summary?: string
  toolCalls: Array<{
    toolName: string
    status: string
  }>
}

export interface FailedEvent extends CopilotEventBase {
  type: "failed"
  agentId?: string
  error: string
}

export type CopilotEvent =
  | ThinkingEvent
  | PlanningEvent
  | ToolStartEvent
  | ToolProgressEvent
  | ToolResultEvent
  | ApprovalRequiredEvent
  | CompletedEvent
  | FailedEvent

export { validateEvent }

export function serializeEvent(event: CopilotEvent): string {
  const { type, ...rest } = event
  return `event: ${type}\ndata: ${JSON.stringify(rest)}\n\n`
}

export function createEvent<T extends CopilotEventType>(
  type: T,
  fields: Omit<Extract<CopilotEvent, { type: T }>, "type" | "timestamp">,
): Extract<CopilotEvent, { type: T }> {
  return {
    type,
    timestamp: new Date().toISOString(),
    ...fields,
  } as Extract<CopilotEvent, { type: T }>
}

export class CopilotEventEmitter {
  private controller: ReadableStreamDefaultController<Uint8Array>
  private encoder: TextEncoder

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.controller = controller
    this.encoder = new TextEncoder()
  }

  emit<T extends CopilotEventType>(
    type: T,
    fields: Omit<Extract<CopilotEvent, { type: T }>, "type" | "timestamp">,
  ): void {
    const event = createEvent(type, fields)
    const result = validateEvent(event as unknown as Record<string, unknown>)
    if (!result.valid && process.env.NODE_ENV === "development") {
      console.warn(`[CopilotEventEmitter] Invalid event "${type}":`, result.errors)
    }
    this.controller.enqueue(this.encoder.encode(serializeEvent(event)))
  }

  close(): void {
    this.controller.close()
  }

  error(err: unknown): void {
    this.controller.error(err)
  }
}
