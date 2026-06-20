import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { AppError, UnauthorizedError, ForbiddenError, handleApiError } from "@/lib/errors"
import { rateLimit, logApiRequest, timeRequest } from "@/lib/infrastructure"
import { authenticateApiKey } from "@/lib/api-key"
import { createAuditEntry } from "@/lib/audit"

export function respond(data: unknown, status = 200) {
  return Response.json({ success: true, data }, { status })
}

export type Role = string

const FALLBACK_PERMISSIONS: Record<string, { create: string[]; read: string[]; update: string[]; delete: string[] }> = {
  products: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  materials: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
  bom: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
  orders: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
  customers: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
  suppliers: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
  invoices: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  quotations: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
  payments: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  categories: { create: ["owner", "admin"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
  warehouses: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  settings: { create: ["owner"], read: ["owner", "admin"], update: ["owner"], delete: ["owner"] },
  accounts: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  journal: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  tax: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  projects: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
  tasks: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin", "member"], delete: ["owner"] },
  workflows: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  roles: { create: ["owner"], read: ["owner", "admin"], update: ["owner"], delete: ["owner"] },
  apiKeys: { create: ["owner", "admin"], read: ["owner", "admin"], update: ["owner", "admin"], delete: ["owner"] },
  auditLogs: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
  users: { create: ["owner"], read: ["owner", "admin"], update: ["owner"], delete: ["owner"] },
}

export type EntityName = keyof typeof FALLBACK_PERMISSIONS

const permissionCache = new Map<string, { permissions: Record<string, Record<string, boolean>>; fetchedAt: number }>()
const CACHE_TTL = 30000

async function getRolePermissions(roleName: string, orgId: string): Promise<Record<string, Record<string, boolean>> | null> {
  const cacheKey = `${orgId}:${roleName}`
  const cached = permissionCache.get(cacheKey)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.permissions
  try {
    const role = await prisma.role.findFirst({ where: { name: roleName, organizationId: orgId } })
    if (role) {
      const perms = JSON.parse(role.permissions)
      permissionCache.set(cacheKey, { permissions: perms, fetchedAt: Date.now() })
      return perms
    }
  } catch { /* fallback */ }
  return null
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new UnauthorizedError()
  return session as { user: { id: string; name?: string; email?: string } }
}

export async function requireOrg() {
  const session = await requireAuth()
  const activeOrgId = (session as any).user?.activeOrganizationId as string | undefined

  const membership = activeOrgId
    ? await prisma.organizationMember.findFirst({
        where: { userId: session.user.id, organizationId: activeOrgId },
        include: { organization: true },
      })
    : null

  const fallback = !membership
    ? await prisma.organizationMember.findFirst({
        where: { userId: session.user.id },
        include: { organization: true },
      })
    : null

  const result = membership || fallback
  if (!result) throw new UnauthorizedError("No organization membership")
  return { org: { id: result.organization.id, name: result.organization.name, slug: result.organization.slug }, role: result.role as Role, userId: session.user.id }
}

export async function requirePermission(entity: EntityName, action: "create" | "read" | "update" | "delete") {
  const { role, org } = await requireOrg()
  const rolePerms = await getRolePermissions(role, org.id)
  if (rolePerms) {
    const entityPerms = rolePerms[entity]
    if (entityPerms && entityPerms[action]) return { role, org }
    const wildcardPerms = rolePerms["*"]
    if (wildcardPerms && wildcardPerms[action]) return { role, org }
  }
  const fallbackAllowed = FALLBACK_PERMISSIONS[entity]?.[action] || []
  if (!fallbackAllowed.includes(role)) {
    throw new ForbiddenError(`Role '${role}' cannot ${action} ${entity}`)
  }
  return { role, org }
}

export async function withAudit<T>(
  entity: string,
  entityId: string,
  action: string,
  orgId: string,
  fn: () => Promise<T>,
  snapshot?: () => Promise<Record<string, any>>
): Promise<T> {
  if (snapshot) await createAuditSnapshot(entity, entityId, orgId, await snapshot())
  const result = await fn()
  await logAudit({ action, entity, entityId, message: `${entity} ${action}`, organizationId: orgId, metadata: { entityId } })
  return result
}

export async function logAudit(opts: {
  action: string
  entity: string
  entityId: string
  message: string
  organizationId: string
  metadata?: Record<string, any>
  userId?: string
}) {
  const session = opts.userId ? undefined : await auth()
  await prisma.activityLog.create({
    data: {
      action: opts.action as any,
      entity: opts.entity,
      entityId: opts.entityId.slice(0, 50),
      message: opts.message.slice(0, 500),
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : undefined,
      userId: opts.userId || session?.user?.id || undefined,
      organizationId: opts.organizationId,
    },
  }).catch(() => {})
}

export async function createAuditSnapshot(entity: string, entityId: string, organizationId: string, data: Record<string, any>) {
  const session = await auth()
  await prisma.activityLog.create({
    data: {
      action: "updated" as any,
      entity,
      entityId: entityId.slice(0, 50),
      message: `Snapshot of ${entity}:${entityId}`,
      metadata: JSON.stringify({ snapshot: data, timestamp: new Date().toISOString(), type: "snapshot" }),
      userId: session?.user?.id || undefined,
      organizationId,
    },
  }).catch(() => {})
}

export async function checkStock(productId: string, quantity: number, organizationId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, organizationId },
    select: { stock: true, name: true },
  })
  if (!product) throw new AppError("Product not found", 404)
  if (product.stock + quantity < 0) {
    throw new AppError(
      `Insufficient stock for "${product.name}": ${Math.abs(quantity)} required, ${product.stock} available`,
      400,
      "INSUFFICIENT_STOCK"
    )
  }
}

export async function withSoftDelete(model: any, id: string, orgId: string, options?: { include?: any }) {
  const record = await model.findFirst({ where: { id, organizationId: orgId, deletedAt: null }, ...options })
  if (!record) throw new AppError("Record not found", 404)
  await model.update({ where: { id }, data: { deletedAt: new Date() } })
  return record as any
}

export function apiHandler(handler: (req: Request, ctx: any) => Promise<Response>) {
  return async (req: Request, ctx: any) => {
    const path = new URL(req.url).pathname
    const start = performance.now()

    try {
      const ip = req.headers.get("x-forwarded-for") || "unknown"
      const rl = rateLimit(ip, 100, 60000)
      if (!rl.allowed) {
        return Response.json({ success: false, data: null, error: "Rate limit exceeded", code: "RATE_LIMITED" }, {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        })
      }

      const response = await handler(req, ctx)
      const duration = Math.round(performance.now() - start)

      let finalResponse = response
      const ct = response.headers.get("content-type")
      if (ct?.includes("application/json")) {
        const clone = response.clone()
        const body = await clone.json().catch(() => null)
        if (body !== null && !(typeof body === "object" && "success" in body)) {
          finalResponse = Response.json({ success: true, data: body }, { status: response.status })
        }
      }

      if (!path.startsWith("/api/health")) {
        logApiRequest(req.method, path, finalResponse.status, duration, undefined, undefined)
      }
      return finalResponse
    } catch (error) {
      const duration = Math.round(performance.now() - start)
      logApiRequest(req.method, path, error instanceof AppError ? error.statusCode || 500 : 500, duration)
      return handleApiError(error)
    }
  }
}

export function clearPermissionCache() {
  permissionCache.clear()
}
