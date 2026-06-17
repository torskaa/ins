import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { AppError } from "@/lib/errors"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const role = await prisma.role.findFirst({ where: { id, organizationId: org.id } })
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 })
  return NextResponse.json(role)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("roles", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const role = await prisma.role.findFirst({ where: { id, organizationId: org.id } })
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 })
  if (role.isSystem && body.name !== undefined && body.name !== role.name) {
    throw new AppError("Cannot rename system roles", 400)
  }
  const data: any = {}
  if (body.name !== undefined && !role.isSystem) data.name = body.name
  if (body.description !== undefined) data.description = body.description
  if (body.permissions !== undefined) data.permissions = JSON.stringify(body.permissions)
  const updated = await prisma.role.update({ where: { id }, data })
  await logAudit({ action: "updated", entity: "Role", entityId: id, message: `Role "${updated.name}" updated`, organizationId: org.id })
  return NextResponse.json(updated)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("roles", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const role = await prisma.role.findFirst({ where: { id, organizationId: org.id } })
  if (!role) return NextResponse.json({ error: "Role not found" }, { status: 404 })
  if (role.isSystem) throw new AppError("Cannot delete system roles", 400)
  await prisma.role.delete({ where: { id } })
  await logAudit({ action: "deleted", entity: "Role", entityId: id, message: `Role "${role.name}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
