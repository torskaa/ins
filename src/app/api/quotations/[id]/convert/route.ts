import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const POST = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("orders", "create")
  const { id } = await params
  const { org } = await requireOrg()

  const quotation = await prisma.quotation.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: { items: { include: { product: true } } },
  })
  if (!quotation) return NextResponse.json({ error: "Quotation not found" }, { status: 404 })
  if (quotation.orderId) return NextResponse.json({ error: "Already converted to order" }, { status: 400 })
  if (quotation.status !== "confirmed" && quotation.status !== "sent") {
    return NextResponse.json({ error: "Only sent or confirmed quotations can be converted" }, { status: 400 })
  }

  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`
  const items = quotation.items.map((i) => ({
    productId: i.productId,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    total: i.quantity * i.unitPrice,
  }))

  const order = await prisma.order.create({
    data: {
      number: orderNumber,
      type: "sales",
      status: "draft",
      customerId: quotation.customerId,
      subtotal: quotation.subtotal,
      total: quotation.total,
      organizationId: org.id,
      items: { create: items },
    },
  })

  await prisma.quotation.update({
    where: { id },
    data: { orderId: order.id, status: "confirmed" },
  })

  await logAudit({ action: "converted", entity: "Quotation", entityId: id, message: `Quotation ${quotation.number} converted to order ${orderNumber}`, organizationId: org.id })
  await logAudit({ action: "created", entity: "Order", entityId: order.id, message: `Order ${orderNumber} created from quotation`, organizationId: org.id })

  return NextResponse.json({ success: true, orderId: order.id, orderNumber })
})
