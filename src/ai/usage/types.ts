export type UsageAction = "tool_execution" | "agent_run"

export type SaaSPlan = "free" | "pro" | "enterprise"

export interface UsageEvent {
  organizationId: string
  userId: string
  agentId?: string
  toolName?: string
  action: UsageAction
  provider?: string
  model?: string
  inputTokens?: number
  outputTokens?: number
  durationMs: number
  success: boolean
  error?: string
  timestamp: Date
}

export interface UsageSummary {
  totalToolCalls: number
  totalAgentRuns: number
  totalInputTokens: number
  totalOutputTokens: number
  byOrganization: Record<string, number>
  byTool: Record<string, number>
}

export interface UsageLimit {
  maxToolCalls: number
  maxAgentRuns: number
  maxInputTokens: number
  maxOutputTokens: number
}

export const SAAS_PLANS: Record<SaaSPlan, UsageLimit> = {
  free: {
    maxToolCalls: 100,
    maxAgentRuns: 50,
    maxInputTokens: 100_000,
    maxOutputTokens: 50_000,
  },
  pro: {
    maxToolCalls: 10_000,
    maxAgentRuns: 5_000,
    maxInputTokens: 10_000_000,
    maxOutputTokens: 5_000_000,
  },
  enterprise: {
    maxToolCalls: Infinity,
    maxAgentRuns: Infinity,
    maxInputTokens: Infinity,
    maxOutputTokens: Infinity,
  },
}

export interface UsageQuota {
  checkLimit(
    organizationId: string,
    plan: SaaSPlan,
  ): Promise<{ allowed: boolean; reason?: string }>

  recordUsage(organizationId: string, plan: SaaSPlan, event: UsageEvent): Promise<void>

  getRemaining(
    organizationId: string,
    plan: SaaSPlan,
  ): Promise<UsageLimit>
}
