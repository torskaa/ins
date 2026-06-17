import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { validate, invoiceSchema } from "@/lib/validation"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const invoices = await prisma.invoice.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(invoices)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("invoices", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const data = validate(invoiceSchema, body)
  const { items, ...invoiceData } = data

  const number = `INV-${Date.now().toString(36).toUpperCase()}`

  const invoice = await prisma.invoice.create({
    data: {
      ...invoiceData,
      number,
      organizationId: org.id,
      items: {
        create: items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
          productId: item.productId,
        })),
      },
      subtotal: items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0),
      total: items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0),
    },
    include: { items: true },
  })

  await logAudit({
    action: "created",
    entity: "Invoice",
    entityId: invoice.id,
    message: `Invoice ${number} created for customer`,
    organizationId: org.id,
  })

  return NextResponse.json(invoice)
})
