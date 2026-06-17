import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const [accounts, groups] = await Promise.all([
    prisma.chartOfAccount.findMany({ where: { organizationId: org.id }, include: { group: true }, orderBy: { code: "asc" } }),
    prisma.accountGroup.findMany({ where: { organizationId: org.id }, include: { children: true }, orderBy: { code: "asc" } }),
  ])
  return NextResponse.json({ accounts, groups })
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  const account = await prisma.chartOfAccount.create({
    data: { code: body.code, name: body.name, type: body.type, groupId: body.groupId, openingBalance: body.openingBalance || 0, currentBalance: body.openingBalance || 0, organizationId: org.id },
  })
  await logAudit({ action: "created", entity: "ChartOfAccount", entityId: account.id, message: `Account "${account.code} - ${account.name}" created`, organizationId: org.id })
  return NextResponse.json(account)
})
