import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const POST = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("invoices", "update")
  const { id } = await params
  const { org } = await requireOrg()
  const body = await request.json()
  const action = body.action as string

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    select: { id: true, number: true, status: true, total: true, paidAmount: true },
  })
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 })

  const statusFlow: Record<string, string[]> = {
    draft: ["sent", "cancelled"],
    sent: ["paid", "overdue", "cancelled"],
    paid: [],
    overdue: ["paid", "cancelled"],
    cancelled: [],
  }

  const allowed = statusFlow[invoice.status] || []
  if (!allowed.includes(action)) {
    return NextResponse.json({ error: `Cannot transition from ${invoice.status} to ${action}` }, { status: 400 })
  }

  const updateData: any = { status: action }

  if (action === "paid") {
    updateData.paidAmount = body.amount || invoice.total
    updateData.paidAt = new Date()
  }

  await prisma.invoice.update({ where: { id }, data: updateData })
  await logAudit({ action: "status_changed", entity: "Invoice", entityId: id, message: `Invoice ${invoice.number} marked as ${action}`, organizationId: org.id })

  return NextResponse.json({ success: true })
})
