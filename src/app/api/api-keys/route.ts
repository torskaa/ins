import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { generateApiKey } from "@/lib/api-key"
import { auth } from "@/lib/auth"
import { AppError } from "@/lib/errors"

export const GET = apiHandler(async () => {
  await requirePermission("apiKeys", "read")
  const { org } = await requireOrg()
  const keys = await prisma.apiKey.findMany({
    where: { organizationId: org.id },
    select: {
      id: true, name: true, keyPrefix: true, lastUsedAt: true,
      expiresAt: true, active: true, permissions: true, userId: true,
      createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(keys)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("apiKeys", "create")
  const { org } = await requireOrg()
  const session = await auth()
  const body = await request.json()
  const { name, permissions, expiresAt } = body
  if (!name || typeof name !== "string") throw new AppError("Name is required", 400)
  const { raw, hash, prefix } = generateApiKey()
  const key = await prisma.apiKey.create({
    data: {
      name,
      keyHash: hash,
      keyPrefix: prefix,
      permissions: permissions || "{}",
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      userId: session?.user?.id || undefined,
      organizationId: org.id,
    },
  })
  await logAudit({ action: "created", entity: "ApiKey", entityId: key.id, message: `API key "${key.name}" created`, organizationId: org.id })
  const { keyHash, ...safe } = key
  return NextResponse.json({ ...safe, raw }, { status: 201 })
})
