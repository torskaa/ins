import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const requestLogs: Map<string, { count: number; resetAt: number }> = new Map()

/**
 * Simple in-memory rate limiter.
 * Limits requests per IP/key within a time window.
 */
export function rateLimit(key: string, maxRequests: number = 60, windowMs: number = 60000): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
  const entry = requestLogs.get(key)

  if (!entry || now > entry.resetAt) {
    requestLogs.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

/**
 * API Request Logger
 * Logs all API requests for audit and monitoring.
 */
export async function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
  userId?: string,
  organizationId?: string
) {
  if (path.startsWith("/_next") || path.startsWith("/__next")) return

  try {
    await prisma.activityLog.create({
      data: {
        action: "created",
        entity: "API",
        entityId: `${method}:${path}`.slice(0, 50),
        message: `${method} ${path} → ${statusCode} (${durationMs}ms)`,
        metadata: JSON.stringify({
          method,
          path,
          statusCode,
          durationMs,
          timestamp: new Date().toISOString(),
        }),
        userId: userId || undefined,
        organizationId: organizationId || "",
      },
    })
  } catch (e) {
    console.warn("Failed to log API request:", e)
  }
}

/**
 * Request timing decorator
 */
export async function timeRequest<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now()
  const result = await fn()
  return { result, durationMs: Math.round(performance.now() - start) }
}

/**
 * Health Check — verifies core dependencies are operational
 */
export async function healthCheck() {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {}

  // Database check
  const dbStart = performance.now()
  try {
    await prisma.product.findFirst({ select: { id: true } })
    checks.database = { status: "ok", latency: Math.round(performance.now() - dbStart) }
  } catch (e: any) {
    checks.database = { status: "error", error: e.message }
  }

  // Auth check
  try {
    const session = await auth()
    checks.auth = { status: session?.user ? "ok" : "unauthenticated" }
  } catch (e: any) {
    checks.auth = { status: "error", error: e.message }
  }

  return {
    status: Object.values(checks).every((c) => c.status === "ok" || c.status === "unauthenticated") ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
  }
}
