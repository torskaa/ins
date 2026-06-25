import { prisma } from "@/lib/db"

export async function createAuditEntry(opts: {
  action: string
  entity: string
  entityId: string
  description?: string
  changes?: Record<string, any>
  userId?: string
  organizationId: string
  ip?: string
  userAgent?: string
}) {
  try {
    await prisma.auditEntry.create({
      data: {
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId.slice(0, 50),
        description: opts.description?.slice(0, 500),
        changes: opts.changes ? JSON.stringify(opts.changes) : undefined,
        userId: opts.userId || undefined,
        organizationId: opts.organizationId,
        ip: opts.ip?.slice(0, 45),
        userAgent: opts.userAgent?.slice(0, 255),
      },
    })
  } catch (e) {
    console.warn("Failed to create audit entry:", e)
  }
}

export function auditChanges(prev: Record<string, any>, next: Record<string, any>): Record<string, { from: any; to: any }> {
  const changes: Record<string, { from: any; to: any }> = {}
  for (const key of Object.keys(next)) {
    if (key === "updatedAt" || key === "createdAt") continue
    if (JSON.stringify(prev[key]) !== JSON.stringify(next[key])) {
      changes[key] = { from: prev[key], to: next[key] }
    }
  }
  return changes
}
