import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params

  const distributor = await prisma.distributor.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      _count: { select: { deliveries: true } },
      deliveries: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  })
  if (!distributor) return NextResponse.json({ error: "Distributor not found" }, { status: 404 })

  return NextResponse.json(distributor)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("suppliers", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()

  const distributor = await prisma.distributor.update({
    where: { id },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      address: body.address,
      taxId: body.taxId,
      contactPerson: body.contactPerson,
      territory: body.territory,
      route: body.route,
      contractStart: body.contractStart ? new Date(body.contractStart) : undefined,
      contractEnd: body.contractEnd ? new Date(body.contractEnd) : undefined,
      status: body.status,
      notes: body.notes,
    },
  })

  await logAudit({ action: "updated", entity: "Distributor", entityId: id, message: `Distributor "${distributor.name}" updated`, organizationId: org.id })
  return NextResponse.json(distributor)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("suppliers", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const distributor = await withSoftDelete(prisma.distributor, id, org.id)
  await logAudit({ action: "deleted", entity: "Distributor", entityId: id, message: `Distributor "${distributor.name}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
