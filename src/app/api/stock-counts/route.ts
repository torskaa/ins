import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const stockCounts = await prisma.stockCount.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: {
      warehouse: { select: { id: true, name: true, location: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(stockCounts)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("warehouses", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const totalItems = body.totalItems || body.items?.length || 0
  const matchedItems = body.matchedItems ?? totalItems
  const discrepancyItems = body.discrepancyItems ?? 0

  const stockCount = await prisma.stockCount.create({
    data: {
      number: body.number,
      status: body.status || "draft",
      countDate: body.countDate ? new Date(body.countDate) : new Date(),
      totalItems,
      matchedItems,
      discrepancyItems,
      notes: body.notes,
      warehouseId: body.warehouseId,
      organizationId: org.id,
      items: body.items ? {
        create: body.items.map((item: any) => ({
          productId: item.productId,
          expectedQty: item.expectedQty || 1,
          actualQty: item.actualQty ?? 0,
          difference: item.difference ?? (item.actualQty != null ? (item.actualQty - (item.expectedQty || 1)) : 0),
          notes: item.notes || null,
        })),
      } : undefined,
    },
    include: { items: { include: { product: { select: { id: true, name: true, sku: true, unitPrice: true, barcode: true } } } } },
  })

  await logAudit({
    action: "created",
    entity: "StockCount",
    entityId: stockCount.id,
    message: `Stock count "${stockCount.number}" created`,
    organizationId: org.id,
  })

  return NextResponse.json(stockCount)
})
