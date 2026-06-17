import { prisma } from "@/lib/db"
import crypto from "crypto"

function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex")
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `sk_${crypto.randomBytes(24).toString("hex")}`
  return { raw, hash: hashKey(raw), prefix: raw.slice(0, 10) }
}

export async function authenticateApiKey(req: Request): Promise<{ userId?: string; organizationId: string; permissions: Record<string, any> } | null> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null

  const rawKey = authHeader.slice(7).trim()
  const keyHash = hashKey(rawKey)

  const apiKey = await prisma.apiKey.findFirst({
    where: { keyHash, active: true },
    include: { organization: true },
  })

  if (!apiKey) return null
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null

  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })

  return {
    userId: apiKey.userId || undefined,
    organizationId: apiKey.organizationId,
    permissions: JSON.parse(apiKey.permissions || "{}"),
  }
}
