import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const order = await prisma.productionOrder.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      product: { select: { id: true, name: true, sku: true, unitPrice: true } },
      bom: { select: { id: true, finishedGoodId: true, version: true, status: true } },
      warehouse: { select: { id: true, name: true, location: true } },
      materials: { include: { product: { select: { id: true, name: true, sku: true, unitPrice: true } } } },
      operations: { include: { workCenter: { select: { id: true, name: true, costPerHour: true } } }, orderBy: { sequence: "asc" } },
    },
  })
  if (!order) return NextResponse.json({ error: "Production order not found" }, { status: 404 })
  return NextResponse.json(order)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const order = await prisma.productionOrder.update({
    where: { id },
    data: {
      number: body.number,
      status: body.status,
      productId: body.productId,
      bomId: body.bomId,
      quantity: body.quantity,
      producedQty: body.producedQty,
      startDate: body.startDate ? new Date(body.startDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      completedDate: body.completedDate ? new Date(body.completedDate) : null,
      notes: body.notes,
      warehouseId: body.warehouseId,
    },
  })
  await logAudit({ action: "updated", entity: "ProductionOrder", entityId: id, message: `Production order "${order.number}" updated`, organizationId: org.id })
  return NextResponse.json(order)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  await withSoftDelete(prisma.productionOrder, id, org.id)
  await logAudit({ action: "deleted", entity: "ProductionOrder", entityId: id, message: "Production order deleted", organizationId: org.id })
  return NextResponse.json({ success: true })
})
