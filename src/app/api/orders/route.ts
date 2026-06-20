import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, checkStock, logAudit } from "@/lib/middleware"
import { validate, orderSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") || "sales"
  const status = searchParams.get("status")

  const where: any = { organizationId: org.id, type }
  if (status) where.status = status

  const orders = await prisma.order.findMany({
    where,
    include: {
      customer: { select: { name: true } },
      supplier: { select: { name: true } },
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(orders)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("orders", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const data = validate(orderSchema, body)
  const { items, ...orderData } = data

  if (orderData.type === "sales") {
    for (const item of items) {
      await checkStock(item.productId, -item.quantity, org.id)
    }
  }

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`

  const { id: orderId } = await prisma.order.create({
    data: {
      ...orderData,
      number: orderNumber,
      organizationId: org.id,
      status: body.status === "confirmed" ? "confirmed" : "draft",
      items: {
        create: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
      subtotal: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
      total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    },
    select: { id: true },
  })

  // Update stock for sales orders
  if (orderData.type === "sales" && body.status === "confirmed") {
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      })
      await prisma.stockMovement.create({
        data: {
          type: "sold",
          quantity: item.quantity,
          productId: item.productId,
          orderId: orderId,
          description: `Sales order ${orderNumber}`,
          organizationId: org.id,
        },
      })
    }
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: { select: { name: true } } } } },
  })

  await logAudit({
    action: body.status === "confirmed" ? "confirmed" : "created",
    entity: "Order",
    entityId: orderId,
    message: `Order ${orderNumber} created with ${items.length} items`,
    organizationId: org.id,
  })

  return NextResponse.json(order)
})
