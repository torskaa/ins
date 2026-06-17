import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { AppError } from "@/lib/errors"

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("users", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  if (!body.role || typeof body.role !== "string") throw new AppError("Role is required", 400)
  const member = await prisma.organizationMember.findFirst({ where: { userId: id, organizationId: org.id } })
  if (!member) return NextResponse.json({ error: "User not found in organization" }, { status: 404 })
  const updated = await prisma.organizationMember.update({ where: { id: member.id }, data: { role: body.role } })
  await logAudit({ action: "updated", entity: "OrganizationMember", entityId: updated.id, message: `User role updated to "${body.role}"`, organizationId: org.id })
  return NextResponse.json(updated)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("users", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const member = await prisma.organizationMember.findFirst({ where: { userId: id, organizationId: org.id } })
  if (!member) return NextResponse.json({ error: "User not found in organization" }, { status: 404 })
  await prisma.organizationMember.delete({ where: { id: member.id } })
  await logAudit({ action: "deleted", entity: "OrganizationMember", entityId: member.id, message: "User removed from organization", organizationId: org.id })
  return NextResponse.json({ success: true })
})
