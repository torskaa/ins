import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const settings = await prisma.organizationSetting.findUnique({
    where: { organizationId: org.id },
  })
  return NextResponse.json(settings || { currency: "THB", taxRate: 7, lowStockThreshold: 10, dateFormat: "DD/MM/YYYY", timezone: "Asia/Bangkok" })
})

export const PUT = apiHandler(async (request: Request) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const body = await request.json()
  const data = {
    currency: body.currency || "THB",
    taxRate: typeof body.taxRate === "number" ? body.taxRate : parseFloat(body.taxRate) || 7,
    lowStockThreshold: typeof body.lowStockThreshold === "number" ? body.lowStockThreshold : parseInt(body.lowStockThreshold) || 10,
    dateFormat: body.dateFormat || "DD/MM/YYYY",
    timezone: body.timezone || "Asia/Bangkok",
  }
  const settings = await prisma.organizationSetting.upsert({
    where: { organizationId: org.id },
    update: data,
    create: { ...data, organizationId: org.id },
  })
  await logAudit({ action: "updated", entity: "OrganizationSetting", entityId: settings.id, message: "Organization settings updated", organizationId: org.id })
  return NextResponse.json(settings)
})
