import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const quotation = await prisma.quotation.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      customer: true,
      order: { select: { id: true, number: true, status: true, total: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true, unitPrice: true } } } },
    },
  })
  if (!quotation) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const activities = await prisma.activityLog.findMany({
    where: { entity: "Quotation", entityId: id },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  return NextResponse.json({ ...quotation, activities })
})

export const PUT = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("quotations", "update")
  const { id } = await params
  const { org } = await requireOrg()
  const body = await request.json()
  const existing = await prisma.quotation.findFirst({ where: { id, organizationId: org.id, deletedAt: null }, select: { number: true } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const statusFlow: Record<string, string[]> = {
    draft: ["sent", "cancelled"],
    sent: ["confirmed", "expired", "cancelled"],
    confirmed: ["expired", "cancelled"],
    expired: [],
    cancelled: [],
  }

  if (body.status && existing.number) {
    const allowed = statusFlow[existing.number] || ["draft", "sent", "confirmed", "expired", "cancelled"]
    // Use the actual status from the DB
    const current = await prisma.quotation.findUnique({ where: { id }, select: { status: true } })
    if (current && body.status !== current.status) {
      const allowedNext = statusFlow[current.status] || []
      if (!allowedNext.includes(body.status)) {
        return NextResponse.json({ error: `Cannot transition from ${current.status} to ${body.status}` }, { status: 400 })
      }
    }
  }

  await prisma.quotation.update({ where: { id }, data: body })
  await logAudit({ action: "updated", entity: "Quotation", entityId: id, message: `Quotation ${existing.number} updated`, organizationId: org.id })
  return NextResponse.json({ success: true })
})

export const DELETE = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("quotations", "delete")
  const { id } = await params
  const { org } = await requireOrg()
  const q = await prisma.quotation.findFirst({ where: { id, organizationId: org.id, deletedAt: null }, select: { number: true } })
  if (!q) return NextResponse.json({ error: "Not found" }, { status: 404 })
  await prisma.quotation.update({ where: { id }, data: { deletedAt: new Date() } })
  await logAudit({ action: "deleted", entity: "Quotation", entityId: id, message: `Quotation ${q.number} deleted`, organizationId: org.id })
  return NextResponse.json({ success: true })
})
