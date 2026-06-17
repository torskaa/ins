import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params

  const payment = await prisma.payment.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      invoice: { select: { id: true, number: true, total: true, status: true } },
      order: { select: { id: true, number: true, total: true, status: true } },
    },
  })
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  return NextResponse.json(payment)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("payments", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const payment = await prisma.payment.update({
    where: { id },
    data: {
      amount: body.amount,
      date: body.date ? new Date(body.date) : undefined,
      method: body.method,
      reference: body.reference,
      notes: body.notes,
    },
  })
  await logAudit({ action: "updated", entity: "Payment", entityId: id, message: `Payment updated`, organizationId: org.id })
  return NextResponse.json(payment)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("payments", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  const payment = await withSoftDelete(prisma.payment, id, org.id)
  await logAudit({ action: "deleted", entity: "Payment", entityId: id, message: `Payment deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
