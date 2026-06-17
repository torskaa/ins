import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { validate, invoiceSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      customer: true,
      order: { include: { items: { include: { product: { select: { name: true } } } } } },
      items: { include: { product: { select: { name: true, sku: true } } } },
      payments: true,
    },
  })
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const activities = await prisma.activityLog.findMany({
    where: { entity: "Invoice", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ ...invoice, activities })
})

export const PUT = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("invoices", "update")
  const { id } = await params
  const { org } = await requireOrg()
  const body = await request.json()
  const existing = await prisma.invoice.findFirst({ where: { id, organizationId: org.id, deletedAt: null }, select: { number: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.invoice.update({ where: { id }, data: body })
  await logAudit({ action: "updated", entity: "Invoice", entityId: id, message: `Invoice ${existing.number} updated`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
