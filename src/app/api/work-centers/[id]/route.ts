import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const wc = await prisma.workCenter.findFirst({ where: { id, organizationId: org.id, deletedAt: null } })
  if (!wc) return NextResponse.json({ error: "Work center not found" }, { status: 404 })
  return NextResponse.json(wc)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const wc = await prisma.workCenter.update({
    where: { id },
    data: {
      code: body.code,
      name: body.name,
      description: body.description,
      costPerHour: body.costPerHour,
      capacity: body.capacity,
      location: body.location,
      isActive: body.isActive,
    },
  })
  await logAudit({ action: "updated", entity: "WorkCenter", entityId: id, message: `Work center "${wc.name}" updated`, organizationId: org.id })
  return NextResponse.json(wc)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  await withSoftDelete(prisma.workCenter, id, org.id)
  await logAudit({ action: "deleted", entity: "WorkCenter", entityId: id, message: "Work center deleted", organizationId: org.id })
  return NextResponse.json({ success: true })
})
