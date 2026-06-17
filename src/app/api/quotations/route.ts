import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { validate, quotationSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get("customerId")
  const status = searchParams.get("status")

  const where: any = { organizationId: org.id, deletedAt: null }
  if (customerId) where.customerId = customerId
  if (status) where.status = status

  const quotations = await prisma.quotation.findMany({
    where,
    include: {
      customer: { select: { name: true, company: true } },
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(quotations)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("quotations", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const data = validate(quotationSchema, body)
  const { items, ...quotationData } = data

  const number = `QTN-${Date.now().toString(36).toUpperCase()}`

  const quotation = await prisma.quotation.create({
    data: {
      ...quotationData,
      number,
      organizationId: org.id,
      status: "draft",
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })),
      },
      subtotal: items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0),
      total: items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0),
    },
    include: { items: true },
  })

  await logAudit({
    action: "created",
    entity: "Quotation",
    entityId: quotation.id,
    message: `Quotation ${number} created for ${quotationData.customerId}`,
    organizationId: org.id,
  })

  return NextResponse.json(quotation)
})
