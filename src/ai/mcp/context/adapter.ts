import type { AiContext } from "@/ai/context/types"
import { DefaultContextBuilder } from "@/ai/context/types"
import type { McpContextInput } from "./types"

const VALID_PERMISSIONS = new Set<string>([
  "inventory:read",
  "inventory:write",
  "orders:read",
  "orders:write",
  "customers:read",
  "customers:write",
  "finance:read",
  "finance:write",
  "ai:execute",
  "admin",
])

export class McpContextAdapter {
  private builder: DefaultContextBuilder

  constructor(builder?: DefaultContextBuilder) {
    this.builder = builder ?? new DefaultContextBuilder()
  }

  adapt(input: McpContextInput, metadata?: Record<string, string>): AiContext {
    if (!input.clientId) throw new Error("clientId is required")
    if (!input.userId) throw new Error("userId is required")
    if (!input.organizationId) throw new Error("organizationId is required")
    if (!input.organizationSlug) throw new Error("organizationSlug is required")

    const sanitized = this.sanitizePermissions(input.permissions)

    const mergedMetadata = {
      ...input.metadata,
      ...metadata,
    }

    return this.builder.build({
      userId: input.userId,
      organizationId: input.organizationId,
      organizationSlug: input.organizationSlug,
      workspaceId: input.workspaceId,
      userRole: input.userRole,
      permissions: sanitized,
      currentModule: "mcp",
      ipAddress: mergedMetadata.ipAddress,
      userAgent: mergedMetadata.userAgent,
    })
  }

  private sanitizePermissions(raw: string[]): string[] {
    return raw.filter((p) => VALID_PERMISSIONS.has(p))
  }
}
