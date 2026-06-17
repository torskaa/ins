import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireAuth, logAudit } from "@/lib/middleware"
import { AppError } from "@/lib/errors"

export const GET = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const session = await requireAuth()
  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, organizationId: id },
    include: { organization: true },
  })
  if (!member) throw new AppError("Workspace not found", 404)
  return NextResponse.json({
    id: member.organization.id,
    name: member.organization.name,
    slug: member.organization.slug,
    role: member.role,
    createdAt: member.organization.createdAt,
  })
})

export const PUT = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const session = await requireAuth()
  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, organizationId: id, role: "owner" },
  })
  if (!member) throw new AppError("Workspace not found or insufficient permissions", 404)
  const { name } = await request.json()
  if (!name || typeof name !== "string") throw new AppError("Name is required", 400)
  const org = await prisma.organization.update({
    where: { id },
    data: { name },
  })
  await logAudit({ action: "updated", entity: "Organization", entityId: org.id, message: `Workspace renamed to "${org.name}"`, organizationId: org.id })
  return NextResponse.json({ id: org.id, name: org.name, slug: org.slug })
})

export const DELETE = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const session = await requireAuth()
  const member = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, organizationId: id, role: "owner" },
  })
  if (!member) throw new AppError("Workspace not found or insufficient permissions", 404)

  const memberCount = await prisma.organizationMember.count({ where: { organizationId: id } })
  if (memberCount > 1) throw new AppError("Cannot delete workspace with other members. Remove them first.", 400)

  await prisma.organization.delete({ where: { id } })
  return NextResponse.json({ success: true })
})
