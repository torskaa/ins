import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"
import { auth } from "@/lib/auth"
import { validate, bomCreateSchema } from "@/lib/validation"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()

  const { searchParams } = new URL(request.url)
  const finishedGoodId = searchParams.get("finishedGoodId")

  const where: any = { organizationId: org.id }
  if (finishedGoodId) where.finishedGoodId = finishedGoodId

  const bomItems = await prisma.billOfMaterial.findMany({
    where,
    include: {
      finishedGood: { select: { id: true, name: true, sku: true, type: true } },
      material: { select: { id: true, name: true, sku: true, type: true, unitPrice: true, uom: true } },
      approvedBy: { select: { id: true, name: true } },
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(bomItems)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("bom", "create")
  const { org } = await requireOrg()

  const body = await request.json()
  const data = validate(bomCreateSchema, body)

  const session = await auth()

  const getNextVersion = async (finishedGoodId: string) => {
    const max = await prisma.billOfMaterial.findFirst({
      where: { finishedGoodId, organizationId: org.id },
      orderBy: { version: "desc" },
      select: { version: true },
    })
    return (max?.version || 0) + 1
  }

  const version = data.version || await getNextVersion(data.finishedGoodId)
  const boms = await prisma.$transaction(
    data.items.map((item) =>
      prisma.billOfMaterial.create({
        data: {
          finishedGoodId: data.finishedGoodId,
          materialId: item.materialId,
          quantity: item.quantity,
          scrapAllowance: item.scrapAllowance,
          unit: item.unit,
          wastePercent: item.wastePercent,
          version,
          status: "draft",
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : undefined,
          notes: data.notes,
          organizationId: org.id,
          createdById: session?.user?.id,
        },
      })
    )
  )

  await logAudit({ action: "created", entity: "BillOfMaterial", entityId: data.finishedGoodId,
    message: `BOM v${version} created with ${data.items.length} materials`, organizationId: org.id })
  return NextResponse.json(boms)
})
