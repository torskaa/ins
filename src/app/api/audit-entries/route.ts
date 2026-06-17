import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request) => {
  await requirePermission("auditLogs", "read")
  const { org } = await requireOrg()
  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")))
  const entity = searchParams.get("entity")
  const action = searchParams.get("action")
  const userId = searchParams.get("userId")
  const dateFrom = searchParams.get("dateFrom")
  const dateTo = searchParams.get("dateTo")

  const where: any = { organizationId: org.id }
  if (entity) where.entity = { contains: entity }
  if (action) where.action = action
  if (userId) where.userId = userId
  if (dateFrom || dateTo) {
    where.createdAt = {}
    if (dateFrom) where.createdAt.gte = new Date(dateFrom)
    if (dateTo) where.createdAt.lte = new Date(dateTo)
  }

  const [entries, total] = await Promise.all([
    prisma.auditEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { name: true, email: true } } },
    }),
    prisma.auditEntry.count({ where }),
  ])

  const mapped = entries.map((e) => ({
    ...e,
    userName: e.user?.name || e.user?.email || "System",
    user: undefined,
  }))

  return NextResponse.json({ entries: mapped, total, page, totalPages: Math.ceil(total / limit) })
})
