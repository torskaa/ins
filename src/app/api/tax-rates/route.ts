import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const rates = await prisma.taxRate.findMany({ where: { organizationId: org.id }, orderBy: { name: "asc" } })
  return NextResponse.json(rates)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  const rate = await prisma.taxRate.create({ data: { name: body.name, rate: parseFloat(body.rate), type: body.type || "vat", isDefault: body.isDefault || false, organizationId: org.id } })
  if (rate.isDefault) await prisma.taxRate.updateMany({ where: { organizationId: org.id, id: { not: rate.id }, type: rate.type }, data: { isDefault: false } })
  await logAudit({ action: "created", entity: "TaxRate", entityId: rate.id, message: `Tax rate "${rate.name} (${rate.rate}%)" created`, organizationId: org.id })
  return NextResponse.json(rate)
})
