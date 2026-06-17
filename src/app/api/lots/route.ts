import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrg, apiHandler, requirePermission, logAudit } from "@/lib/middleware"
import { validate, lotSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")

  const where: any = { organizationId: org.id, deletedAt: null }
  if (productId) where.productId = productId

  const lots = await prisma.lot.findMany({
    where,
    include: {
      product: { select: { name: true, sku: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { receivedDate: "desc" },
  })

  return NextResponse.json(lots)
})

export const POST = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  await requirePermission("products", "update")
  const body = await request.json()
  const data = validate(lotSchema, body)

  const lot = await prisma.lot.create({
    data: {
      number: data.number,
      productId: data.productId,
      supplierId: data.supplierId,
      quantity: data.quantity,
      costPrice: data.costPrice,
      receivedDate: data.receivedDate ? new Date(data.receivedDate) : new Date(),
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      notes: data.notes,
      organizationId: org.id,
    },
  })

  await prisma.product.update({
    where: { id: data.productId },
    data: { stock: { increment: data.quantity } },
  })

  await logAudit({
    action: "received",
    entity: "Lot",
    entityId: lot.id,
    message: `Lot ${lot.number} received: ${data.quantity} units`,
    organizationId: org.id,
  })

  return NextResponse.json(lot)
})
