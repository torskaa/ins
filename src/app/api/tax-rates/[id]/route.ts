import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const rate = await prisma.taxRate.findFirst({ where: { id, organizationId: org.id } })
  if (!rate) return NextResponse.json({ error: "Tax rate not found" }, { status: 404 })
  return NextResponse.json(rate)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const rate = await prisma.taxRate.update({ where: { id }, data: { name: body.name, rate: parseFloat(body.rate), type: body.type, isDefault: body.isDefault } })
  if (rate.isDefault) await prisma.taxRate.updateMany({ where: { organizationId: org.id, id: { not: rate.id }, type: rate.type }, data: { isDefault: false } })
  await logAudit({ action: "updated", entity: "TaxRate", entityId: id, message: `Tax rate "${rate.name}" updated`, organizationId: org.id })
  return NextResponse.json(rate)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  await prisma.taxRate.delete({ where: { id, organizationId: org.id } })
  await logAudit({ action: "deleted", entity: "TaxRate", entityId: id, message: "Tax rate deleted", organizationId: org.id })
  return NextResponse.json({ success: true })
})
