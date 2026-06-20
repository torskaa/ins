export interface AiContext {
  userId: string
  organizationId: string
  organizationSlug: string
  workspaceId?: string
  userRole: string
  permissions: string[]
  currentModule?: string
  selectedRecordId?: string
  selectedRecordType?: string
  ipAddress?: string
  userAgent?: string
}

export interface ContextBuilder {
  build(params: Partial<AiContext>): AiContext
}

export class DefaultContextBuilder implements ContextBuilder {
  build(params: Partial<AiContext>): AiContext {
    if (!params.userId) throw new Error("userId is required")
    if (!params.organizationId) throw new Error("organizationId is required")
    if (!params.organizationSlug) throw new Error("organizationSlug is required")

    return {
      userId: params.userId,
      organizationId: params.organizationId,
      organizationSlug: params.organizationSlug,
      workspaceId: params.workspaceId,
      userRole: params.userRole ?? "member",
      permissions: params.permissions ?? [],
      currentModule: params.currentModule,
      selectedRecordId: params.selectedRecordId,
      selectedRecordType: params.selectedRecordType,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    }
  }
}
