import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params

  const delivery = await prisma.delivery.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      distributor: true,
      warehouse: { select: { id: true, name: true, location: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, barcode: true } } } },
      tracking: { orderBy: { timestamp: "asc" } },
    },
  })
  if (!delivery) return NextResponse.json({ error: "Delivery not found" }, { status: 404 })

  return NextResponse.json(delivery)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("orders", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()

  const delivery = await prisma.delivery.update({
    where: { id },
    data: {
      number: body.number,
      status: body.status,
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
      estimatedDate: body.estimatedDate ? new Date(body.estimatedDate) : undefined,
      actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
      notes: body.notes,
      origin: body.origin,
      destination: body.destination,
      totalItems: body.totalItems,
      totalValue: body.totalValue,
      distributorId: body.distributorId,
      warehouseId: body.warehouseId,
    },
  })

  await logAudit({ action: "updated", entity: "Delivery", entityId: id, message: `Delivery "${delivery.number}" updated`, organizationId: org.id })
  return NextResponse.json(delivery)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("orders", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const delivery = await withSoftDelete(prisma.delivery, id, org.id)
  await logAudit({ action: "deleted", entity: "Delivery", entityId: id, message: `Delivery "${delivery.number}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
