import type { AiContext } from "../context/types"

export type ExecutionStatus = "success" | "error" | "denied"

export interface ExecutionLogEntry {
  userId: string
  organizationId: string
  toolName: string
  input: Record<string, unknown>
  output?: unknown
  status: ExecutionStatus
  errorMessage?: string
  durationMs?: number
  ipAddress?: string
  userAgent?: string
  timestamp: Date
}

export interface ExecutionLogger {
  log(entry: ExecutionLogEntry): Promise<void>
  findByUser(userId: string, limit?: number): Promise<ExecutionLogEntry[]>
  findByOrganization(organizationId: string, limit?: number): Promise<ExecutionLogEntry[]>
  findByTool(toolName: string, limit?: number): Promise<ExecutionLogEntry[]>
}
