import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const workCenters = await prisma.workCenter.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(workCenters)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  const workCenter = await prisma.workCenter.create({
    data: {
      code: body.code,
      name: body.name,
      description: body.description,
      costPerHour: body.costPerHour || 0,
      capacity: body.capacity || 1,
      location: body.location,
      isActive: body.isActive ?? true,
      organizationId: org.id,
    },
  })
  await logAudit({ action: "created", entity: "WorkCenter", entityId: workCenter.id, message: `Work center "${workCenter.name}" created`, organizationId: org.id })
  return NextResponse.json(workCenter)
})
