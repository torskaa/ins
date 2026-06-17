import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const orders = await prisma.productionOrder.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      bom: { select: { id: true, finishedGoodId: true, version: true } },
      warehouse: { select: { id: true, name: true } },
      _count: { select: { materials: true, operations: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(orders)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()

  const order = await prisma.productionOrder.create({
    data: {
      number: body.number,
      status: body.status || "draft",
      productId: body.productId,
      bomId: body.bomId || null,
      quantity: body.quantity || 1,
      producedQty: 0,
      startDate: body.startDate ? new Date(body.startDate) : null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      notes: body.notes,
      warehouseId: body.warehouseId || null,
      organizationId: org.id,
      materials: body.materials ? {
        create: body.materials.map((m: any) => ({
          productId: m.productId,
          quantityNeeded: m.quantityNeeded || 1,
          quantityIssued: m.quantityIssued || 0,
        })),
      } : undefined,
      operations: body.operations ? {
        create: body.operations.map((o: any, idx: number) => ({
          sequence: o.sequence ?? idx + 1,
          name: o.name,
          setupTime: o.setupTime || 0,
          runTime: o.runTime || 0,
          workCenterId: o.workCenterId,
        })),
      } : undefined,
    },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      materials: { include: { product: { select: { id: true, name: true, sku: true } } } },
      operations: { include: { workCenter: { select: { id: true, name: true } } } },
    },
  })

  await logAudit({ action: "created", entity: "ProductionOrder", entityId: order.id, message: `Production order "${order.number}" created`, organizationId: org.id })
  return NextResponse.json(order)
})
