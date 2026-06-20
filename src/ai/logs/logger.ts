import type { ExecutionLogEntry, ExecutionLogger, ExecutionStatus } from "./types"
import type { AiContext } from "../context/types"

const inMemoryLogs: ExecutionLogEntry[] = []

const MAX_MEMORY_LOGS = 1000

function mapStatus(status: ExecutionStatus): string {
  return status
}

export class ConsoleExecutionLogger implements ExecutionLogger {
  async log(entry: ExecutionLogEntry): Promise<void> {
    inMemoryLogs.unshift(entry)
    if (inMemoryLogs.length > MAX_MEMORY_LOGS) {
      inMemoryLogs.pop()
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[AI:${entry.status}] ${entry.toolName} (${entry.durationMs ?? "?"}ms)`,
        entry.input,
      )
    }
  }

  async findByUser(userId: string, limit = 50): Promise<ExecutionLogEntry[]> {
    return inMemoryLogs.filter(e => e.userId === userId).slice(0, limit)
  }

  async findByOrganization(
    organizationId: string,
    limit = 50,
  ): Promise<ExecutionLogEntry[]> {
    return inMemoryLogs
      .filter(e => e.organizationId === organizationId)
      .slice(0, limit)
  }

  async findByTool(toolName: string, limit = 50): Promise<ExecutionLogEntry[]> {
    return inMemoryLogs.filter(e => e.toolName === toolName).slice(0, limit)
  }
}

export async function createExecutionLogEntry(
  toolName: string,
  input: Record<string, unknown>,
  output: unknown,
  status: ExecutionStatus,
  ctx: AiContext,
  durationMs?: number,
  errorMessage?: string,
): Promise<ExecutionLogEntry> {
  return {
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    toolName,
    input,
    output,
    status,
    errorMessage,
    durationMs,
    ipAddress: ctx.ipAddress,
    userAgent: ctx.userAgent,
    timestamp: new Date(),
  }
}

export const executionLogger: ExecutionLogger = new ConsoleExecutionLogger()
