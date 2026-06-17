import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const group = await prisma.accountGroup.findFirst({ where: { id, organizationId: org.id }, include: { accounts: true, children: true } })
  if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 })
  return NextResponse.json(group)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const group = await prisma.accountGroup.update({ where: { id }, data: { name: body.name, type: body.type, code: body.code, description: body.description, parentId: body.parentId || null } })
  return NextResponse.json(group)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  await prisma.accountGroup.delete({ where: { id, organizationId: org.id } })
  return NextResponse.json({ success: true })
})
