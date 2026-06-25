import type { CopilotEvent, CopilotEventType } from "./events"
import { CopilotEventTypes } from "./events"

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const REQUIRED_FIELDS: Record<CopilotEventType, string[]> = {
  thinking: ["message"],
  planning: ["message"],
  tool_start: ["toolName", "input"],
  tool_progress: ["toolName", "message"],
  content_chunk: ["chunk"],
  tool_result: ["toolName", "status"],
  approval_required: ["toolName", "input", "reason"],
  completed: ["toolCalls"],
  failed: ["error"],
}

export function validateEvent(event: Record<string, unknown>): ValidationResult {
  const errors: string[] = []

  if (event.type == null || event.type === "") {
    errors.push("type is required")
  } else if (!CopilotEventTypes.includes(event.type as CopilotEventType)) {
    errors.push(`type must be one of: ${CopilotEventTypes.join(", ")}`)
  }

  if (event.timestamp == null || event.timestamp === "") {
    errors.push("timestamp is required")
  } else if (typeof event.timestamp === "string") {
    const parsed = new Date(event.timestamp)
    if (isNaN(parsed.getTime())) {
      errors.push("timestamp must be a valid ISO 8601 string")
    }
  } else {
    errors.push("timestamp must be a string")
  }

  const type = event.type as CopilotEventType
  const required = REQUIRED_FIELDS[type]
  if (required) {
    for (const field of required) {
      if (event[field] == null) {
        errors.push(`${field} is required for ${type} event`)
      }
    }
  }

  if (type === "tool_result") {
    const status = event.status as string
    if (status !== "success" && status !== "error") {
      errors.push('tool_result status must be "success" or "error"')
    }
  }

  if (type === "completed") {
    const calls = event.toolCalls
    if (calls != null && !Array.isArray(calls)) {
      errors.push("completed toolCalls must be an array")
    }
  }

  return { valid: errors.length === 0, errors }
}
