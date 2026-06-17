import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("apiKeys", "read")
  const { org } = await requireOrg()
  const { id } = await params
  const key = await prisma.apiKey.findFirst({
    where: { id, organizationId: org.id },
    select: {
      id: true, name: true, keyPrefix: true, lastUsedAt: true,
      expiresAt: true, active: true, permissions: true, userId: true,
      createdAt: true, updatedAt: true,
    },
  })
  if (!key) return NextResponse.json({ error: "API key not found" }, { status: 404 })
  return NextResponse.json(key)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("apiKeys", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const existing = await prisma.apiKey.findFirst({ where: { id, organizationId: org.id } })
  if (!existing) return NextResponse.json({ error: "API key not found" }, { status: 404 })
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.permissions !== undefined) data.permissions = typeof body.permissions === "string" ? body.permissions : JSON.stringify(body.permissions)
  if (body.active !== undefined) data.active = body.active
  if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null
  const updated = await prisma.apiKey.update({ where: { id }, data })
  await logAudit({ action: "updated", entity: "ApiKey", entityId: id, message: `API key "${updated.name}" updated`, organizationId: org.id })
  return NextResponse.json(updated)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("apiKeys", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const key = await prisma.apiKey.findFirst({ where: { id, organizationId: org.id } })
  if (!key) return NextResponse.json({ error: "API key not found" }, { status: 404 })
  await prisma.apiKey.delete({ where: { id } })
  await logAudit({ action: "deleted", entity: "ApiKey", entityId: id, message: `API key "${key.name}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
