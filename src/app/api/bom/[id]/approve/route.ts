import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, logAudit } from "@/lib/middleware"
import { validate, bomActionSchema } from "@/lib/validation"

export const POST = apiHandler(async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const body = await request.json()
  const data = validate(bomActionSchema, body)
  const action = data.action

  const bom = await prisma.billOfMaterial.findFirst({ where: { id, organizationId: org.id } })
  if (!bom) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "approve") {
    if (bom.status !== "submitted") {
      return NextResponse.json({ error: "Only submitted BOMs can be approved" }, { status: 400 })
    }
    const updated = await prisma.billOfMaterial.update({
      where: { id },
      data: { status: "approved", approvedAt: new Date() },
    })
    await logAudit({ action: "approved", entity: "BillOfMaterial", entityId: id, message: "BOM approved", organizationId: org.id })
    return NextResponse.json(updated)
  }

  if (action === "submit") {
    if (bom.status !== "draft") {
      return NextResponse.json({ error: "Only draft BOMs can be submitted" }, { status: 400 })
    }
    const updated = await prisma.billOfMaterial.update({
      where: { id },
      data: { status: "submitted" },
    })
    await logAudit({ action: "submitted", entity: "BillOfMaterial", entityId: id, message: "BOM submitted for approval", organizationId: org.id })
    return NextResponse.json(updated)
  }

  if (action === "archive") {
    const updated = await prisma.billOfMaterial.update({
      where: { id },
      data: { status: "archived", expiryDate: new Date() },
    })
    await logAudit({ action: "archived", entity: "BillOfMaterial", entityId: id, message: "BOM archived", organizationId: org.id })
    return NextResponse.json(updated)
  }

  if (action === "new-version") {
    const allVersions = await prisma.billOfMaterial.findMany({
      where: { finishedGoodId: bom.finishedGoodId, materialId: bom.materialId },
      orderBy: { version: "desc" },
      take: 1,
    })
    const newVersion = (allVersions[0]?.version || 1) + 1

    const updated = await prisma.billOfMaterial.update({
      where: { id },
      data: { version: newVersion, status: "draft", approvedById: null, approvedAt: null },
    })
    await logAudit({ action: "versioned", entity: "BillOfMaterial", entityId: id, message: `BOM version bumped to v${newVersion}`, organizationId: org.id, metadata: { newVersion } })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
})
