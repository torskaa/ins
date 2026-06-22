import type { ToolPermission } from "@/ai/permissions/types"

export interface McpContextInput {
  clientId: string
  userId: string
  organizationId: string
  organizationSlug: string
  userRole: string
  permissions: string[]
  workspaceId?: string
  metadata?: Record<string, string>
}
