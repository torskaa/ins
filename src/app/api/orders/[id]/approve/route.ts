import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered", "returned"],
  delivered: ["returned"],
  cancelled: [],
  returned: [],
}

export const POST = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("orders", "update")
  const { id } = await params
  const { org, role } = await requireOrg()

  const body = await request.json()
  const { status } = body

  const order = await prisma.order.findFirst({
    where: { id, organizationId: org.id },
    include: { items: true },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const allowed = VALID_TRANSITIONS[order.status] || []
  if (!allowed.includes(status)) {
    return NextResponse.json({
      error: `Invalid transition from '${order.status}' to '${status}'. Allowed: ${allowed.join(", ") || "none"}`,
    }, { status: 400 })
  }

  // Stock reconciliation on cancellation
  if (status === "cancelled" && order.type === "sales") {
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
      await prisma.stockMovement.create({
        data: {
          type: "adjusted",
          quantity: item.quantity,
          productId: item.productId,
          orderId: id,
          description: `Stock returned from cancelled order ${order.number}`,
          organizationId: order.organizationId,
        },
      })
    }
  }

  // On delivery, update received quantities for 3-way matching
  if (status === "delivered" && order.type === "purchase") {
    for (const item of order.items) {
      await prisma.orderItem.update({
        where: { id: item.id },
        data: { receivedQty: { increment: item.quantity } },
      })
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      })
      await prisma.stockMovement.create({
        data: {
          type: "received",
          quantity: item.quantity,
          productId: item.productId,
          orderId: id,
          description: `Goods received for PO ${order.number}`,
          organizationId: order.organizationId,
        },
      })
    }
  }

  const updateData: any = { status }
  if (status === "delivered") updateData.deliveredAt = new Date()

  await prisma.order.update({
    where: { id },
    data: updateData,
  })

  await logAudit({
    action: status === "cancelled" ? "deleted" : "updated",
    entity: "Order",
    entityId: id,
    message: `Order ${order.number} status changed: ${order.status} → ${status}`,
    organizationId: org.id,
    metadata: { from: order.status, to: status, type: order.type },
  })

  return NextResponse.json({ success: true, from: order.status, to: status })
})
