import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const deliveries = await prisma.delivery.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: {
      distributor: { select: { id: true, name: true, territory: true } },
      _count: { select: { items: true, tracking: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(deliveries)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("orders", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const delivery = await prisma.delivery.create({
    data: {
      number: body.number,
      status: body.status || "draft",
      trackingNumber: body.trackingNumber,
      carrier: body.carrier,
      estimatedDate: body.estimatedDate ? new Date(body.estimatedDate) : undefined,
      actualDate: body.actualDate ? new Date(body.actualDate) : undefined,
      notes: body.notes,
      origin: body.origin,
      destination: body.destination,
      totalItems: body.totalItems || body.items?.length || 0,
      totalValue: body.totalValue || 0,
      distributorId: body.distributorId,
      warehouseId: body.warehouseId,
      organizationId: org.id,
      items: body.items ? {
        create: body.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity || 1,
          deliveredQty: item.deliveredQty || 0,
          unitPrice: item.unitPrice || 0,
          total: item.total || ((item.unitPrice || 0) * (item.quantity || 1)),
        })),
      } : undefined,
    },
    include: { items: { include: { product: { select: { id: true, name: true, sku: true } } } } },
  })

  await logAudit({
    action: "created",
    entity: "Delivery",
    entityId: delivery.id,
    message: `Delivery "${delivery.number}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(delivery)
})
