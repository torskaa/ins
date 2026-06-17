import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, createAuditSnapshot as createSnapshot } from "@/lib/middleware"

export const GET = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const bom = await prisma.billOfMaterial.findFirst({
    where: { id, organizationId: org.id },
    include: {
      finishedGood: { select: { id: true, name: true, sku: true, type: true } },
      material: { select: { id: true, name: true, sku: true, type: true, unitPrice: true, uom: true } },
      approvedBy: { select: { id: true, name: true } },
    },
  })
  if (!bom) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(bom)
})

export const PUT = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("bom", "update")
  const { id } = await params
  const { org } = await requireOrg()

  const existing = await prisma.billOfMaterial.findFirst({ where: { id, organizationId: org.id } })
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (existing.status === "approved") {
    return NextResponse.json({ error: "Cannot edit an approved BOM. Create a new version instead." }, { status: 400 })
  }

  const body = await request.json()
  await createSnapshot("BillOfMaterial", id, org.id, existing)

  const updated = await prisma.billOfMaterial.update({
    where: { id },
    data: {
      quantity: body.quantity !== undefined ? parseFloat(body.quantity) : existing.quantity,
      scrapAllowance: body.scrapAllowance !== undefined ? parseFloat(body.scrapAllowance) : existing.scrapAllowance,
      unit: body.unit || existing.unit,
      wastePercent: body.wastePercent !== undefined ? parseFloat(body.wastePercent) : existing.wastePercent,
      notes: body.notes !== undefined ? body.notes : existing.notes,
    },
  })

  await logAudit({ action: "updated", entity: "BillOfMaterial", entityId: id, message: `BOM entry updated`, organizationId: org.id })

  return NextResponse.json(updated)
})

export const DELETE = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  await requirePermission("bom", "delete")
  const { id } = await params
  const { org } = await requireOrg()

  const bom = await prisma.billOfMaterial.findFirst({ where: { id, organizationId: org.id } })
  if (!bom) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (bom.status === "approved") {
    return NextResponse.json({ error: "Cannot delete an approved BOM. Archive it instead." }, { status: 400 })
  }

  await prisma.billOfMaterial.delete({ where: { id } })
  await logAudit({ action: "deleted", entity: "BillOfMaterial", entityId: id, message: "BOM entry deleted", organizationId: org.id })
  return NextResponse.json({ success: true })
})
