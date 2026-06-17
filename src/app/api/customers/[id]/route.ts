import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"
import { validate, customerSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const customer = await prisma.customer.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: { _count: { select: { orders: true, invoices: true, quotations: true } } },
  })
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [orders, quotations, invoices, payments] = await Promise.all([
    prisma.order.findMany({ where: { customerId: id, organizationId: org.id }, orderBy: { createdAt: "desc" }, take: 20, include: { items: { select: { quantity: true, total: true, product: { select: { name: true } } } } } }),
    prisma.quotation.findMany({ where: { customerId: id, organizationId: org.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.invoice.findMany({ where: { customerId: id, organizationId: org.id, deletedAt: null }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.payment.findMany({ where: { order: { customerId: id } }, orderBy: { date: "desc" }, take: 20, include: { invoice: { select: { number: true } }, order: { select: { number: true } } } }),
  ])

  const totalDue = invoices.filter((i) => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + (i.total - i.paidAmount), 0)
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)

  return NextResponse.json({
    ...customer,
    orders,
    quotations,
    invoices,
    payments,
    financialSummary: {
      totalOrders: orders.length,
      totalOrderValue: orders.reduce((s, o) => s + o.total, 0),
      totalInvoiced: invoices.reduce((s, i) => s + i.total, 0),
      totalPaid,
      totalDue: Math.max(0, totalDue),
      creditRemaining: customer.creditLimit ? Math.max(0, customer.creditLimit - totalDue) : null,
    },
  })
})

export const PUT = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("customers", "update")
  const { id } = await params
  const { org } = await requireOrg()
  const body = await request.json()
  const data = validate(customerSchema, body)
  const existing = await prisma.customer.findFirst({ where: { id, organizationId: org.id, deletedAt: null }, select: { name: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const customer = await prisma.customer.update({ where: { id }, data })
  await logAudit({ action: "updated", entity: "Customer", entityId: id, message: `Customer "${customer.name}" updated`, organizationId: org.id })
  return NextResponse.json(customer)
})

export const DELETE = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("customers", "delete")
  const { id } = await params
  const { org } = await requireOrg()
  const customer: any = await withSoftDelete(prisma.customer, id, org.id)
  await logAudit({ action: "deleted", entity: "Customer", entityId: id, message: `Customer "${customer.name}" deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
