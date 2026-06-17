import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"
import { validate, orderUpdateSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const order = await prisma.order.findFirst({
    where: { id, organizationId: org.id },
    include: { customer: true, supplier: true, items: { include: { product: true } } },
  })
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const [payments, invoices, stockMovements] = await Promise.all([
    prisma.payment.findMany({ where: { orderId: id, deletedAt: null }, orderBy: { date: "desc" } }),
    prisma.invoice.findMany({ where: { orderId: id, deletedAt: null }, include: { items: true }, orderBy: { createdAt: "desc" } }),
    prisma.stockMovement.findMany({ where: { orderId: id }, orderBy: { createdAt: "desc" } }),
  ])

  return NextResponse.json({ ...order, payments, invoices, stockMovements })
})

export const PATCH = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("orders", "update")
  const { id } = await params
  const { org } = await requireOrg()
  const body = await request.json()
  const data = validate(orderUpdateSchema, body)
  const existing = await prisma.order.findFirst({ where: { id, organizationId: org.id }, select: { number: true, status: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.order.update({ where: { id }, data })
  const isApproval = body.status === "approved"
  await logAudit({ action: isApproval ? "approved" : "updated", entity: "Order", entityId: id, message: isApproval ? `Order ${existing.number} approved` : `Order ${existing.number} updated`, organizationId: org.id })
  return NextResponse.json({ success: true })
})

export const DELETE = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("orders", "delete")
  const { id } = await params
  const { org } = await requireOrg()
  const order = await withSoftDelete(prisma.order, id, org.id)
  await logAudit({ action: "deleted", entity: "Order", entityId: id, message: `Order ${order.number} deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
