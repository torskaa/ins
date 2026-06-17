import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const POST = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const action = body.action as string

  const order = await prisma.productionOrder.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      materials: { include: { product: true } },
      product: true,
      bom: true,
    },
  })
  if (!order) return NextResponse.json({ error: "Production order not found" }, { status: 404 })

  const statusFlow: Record<string, string[]> = {
    draft: ["confirmed"],
    confirmed: ["in_progress", "cancelled"],
    in_progress: ["completed", "cancelled"],
    completed: [],
    cancelled: [],
  }

  const allowed = statusFlow[order.status] || []
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: `Cannot transition from ${order.status} to ${action}` }, { status: 400 })
  }

  const updateData: any = { status: action }

  if (action === "in_progress") {
    // Issue raw materials: create stock movements + decrease stock
    for (const mat of order.materials) {
      const qty = mat.quantityNeeded - mat.quantityIssued
      if (qty > 0) {
        await prisma.stockMovement.create({
          data: {
            type: "issued",
            quantity: -qty,
            description: `Issued to production order ${order.number}`,
            reference: order.number,
            productId: mat.productId,
          },
        })
        await prisma.product.update({
          where: { id: mat.productId },
          data: { stock: { decrement: qty } },
        })
      }
    }
    for (const mat of order.materials) {
      await prisma.productionOrderMaterial.updateMany({
        where: { orderId: id, productId: mat.productId },
        data: { quantityIssued: mat.quantityNeeded },
      })
    }
  }

  if (action === "completed") {
    // Receive finished goods
    const producedQty = body.producedQty || order.quantity
    await prisma.stockMovement.create({
      data: {
        type: "produced",
        quantity: producedQty,
        description: `Produced from production order ${order.number}`,
        reference: order.number,
        productId: order.productId,
      },
    })
    await prisma.product.update({
      where: { id: order.productId },
      data: { stock: { increment: producedQty } },
    })
    updateData.producedQty = producedQty
    updateData.completedDate = new Date()
  }

  const updated = await prisma.productionOrder.update({
    where: { id },
    data: updateData,
  })

  await logAudit({ action: "status_changed", entity: "ProductionOrder", entityId: id, message: `Production order "${order.number}" ${action}`, organizationId: org.id })
  return NextResponse.json(updated)
})
