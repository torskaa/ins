import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params

  const stockCount = await prisma.stockCount.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      warehouse: { select: { id: true, name: true, location: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, unitPrice: true, barcode: true } } } },
    },
  })
  if (!stockCount) return NextResponse.json({ error: "Stock count not found" }, { status: 404 })

  return NextResponse.json(stockCount)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("warehouses", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()

  const stockCount = await prisma.stockCount.update({
    where: { id },
    data: {
      number: body.number,
      status: body.status,
      countDate: body.countDate ? new Date(body.countDate) : undefined,
      totalItems: body.totalItems,
      matchedItems: body.matchedItems,
      discrepancyItems: body.discrepancyItems,
      notes: body.notes,
      warehouseId: body.warehouseId,
    },
  })

  await logAudit({ action: "updated", entity: "StockCount", entityId: id, message: `Stock count "${stockCount.number}" updated`, organizationId: org.id })
  return NextResponse.json(stockCount)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("warehouses", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const stockCount = await withSoftDelete(prisma.stockCount, id, org.id)
  await logAudit({ action: "deleted", entity: "StockCount", entityId: id, message: `Stock count "${stockCount.number}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
