import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const payments = await prisma.payment.findMany({
    where: { organizationId: org.id, deletedAt: null },
    include: { invoice: { select: { number: true } }, order: { select: { number: true } } },
    orderBy: { date: "desc" },
  })
  return NextResponse.json(payments)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("payments", "create")
  const { org } = await requireOrg()

  const body = await request.json()

  const payment = await prisma.payment.create({
    data: {
      amount: body.amount,
      date: body.date ? new Date(body.date) : new Date(),
      method: body.method || "bank_transfer",
      reference: body.reference,
      notes: body.notes,
      invoiceId: body.invoiceId,
      orderId: body.orderId,
      organizationId: org.id,
    },
  })

  if (body.invoiceId) {
    await prisma.invoice.update({
      where: { id: body.invoiceId },
      data: { paidAmount: { increment: body.amount } },
    })
  }

  await logAudit({
    action: "paid",
    entity: "Payment",
    entityId: payment.id,
    message: `Payment ${payment.reference || payment.id} of ${body.amount} recorded`,
    organizationId: org.id,
  })

  return NextResponse.json(payment)
})
