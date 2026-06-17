import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const groups = await prisma.accountGroup.findMany({
    where: { organizationId: org.id },
    include: { _count: { select: { accounts: true } }, children: true },
    orderBy: { code: "asc" },
  })
  return NextResponse.json(groups)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  const group = await prisma.accountGroup.create({
    data: { name: body.name, type: body.type, code: body.code, description: body.description, parentId: body.parentId || null, organizationId: org.id },
  })
  await logAudit({ action: "created", entity: "AccountGroup", entityId: group.id, message: `Group "${group.name}" created`, organizationId: org.id })
  return NextResponse.json(group)
})
