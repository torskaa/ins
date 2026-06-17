import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const account = await prisma.chartOfAccount.findFirst({ where: { id, organizationId: org.id }, include: { group: true } })
  if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 })
  return NextResponse.json(account)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const account = await prisma.chartOfAccount.update({ where: { id }, data: { code: body.code, name: body.name, type: body.type, groupId: body.groupId, isActive: body.isActive } })
  await logAudit({ action: "updated", entity: "ChartOfAccount", entityId: id, message: `Account "${account.code} - ${account.name}" updated`, organizationId: org.id })
  return NextResponse.json(account)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  await prisma.chartOfAccount.delete({ where: { id, organizationId: org.id } })
  await logAudit({ action: "deleted", entity: "ChartOfAccount", entityId: id, message: "Account deleted", organizationId: org.id })
  return NextResponse.json({ success: true })
})
